import { Router } from "express";
import { db, usersTable, questionsTable, votesTable } from "@workspace/db";
import { eq, ilike, or, sql, count, desc, asc } from "drizzle-orm";
import { authenticate, optionalAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

const CATEGORIES = ["Technology", "Science", "Lifestyle", "Education", "Health", "Entertainment", "Business"];

// helper: build user profile snippet
async function getUserProfile(authorId: number) {
  const [user] = await db.select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, bio: usersTable.bio, avatarUrl: usersTable.avatarUrl, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable).where(eq(usersTable.id, authorId));
  return user;
}

// GET /api/questions
router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const sort = (req.query.sort as string) || "newest";

  let query = db.select().from(questionsTable);
  let countQuery = db.select({ count: count() }).from(questionsTable);

  const conditions: any[] = [];
  if (category) conditions.push(eq(questionsTable.category, category));
  if (search) {
    conditions.push(or(ilike(questionsTable.title, `%${search}%`), ilike(questionsTable.body, `%${search}%`)));
  }
  if (conditions.length === 1) {
    query = query.where(conditions[0]) as any;
    countQuery = countQuery.where(conditions[0]) as any;
  } else if (conditions.length > 1) {
    const combined = conditions.reduce((a, b) => sql`${a} AND ${b}`);
    query = query.where(combined) as any;
    countQuery = countQuery.where(combined) as any;
  }

  if (sort === "popular") {
    query = query.orderBy(desc(questionsTable.votes)) as any;
  } else if (sort === "unanswered") {
    query = query.orderBy(asc(questionsTable.answerCount)) as any;
  } else {
    query = query.orderBy(desc(questionsTable.createdAt)) as any;
  }

  const [questions, [{ count: total }]] = await Promise.all([
    query.limit(limit).offset(offset),
    countQuery,
  ]);

  // fetch authors and user votes in parallel
  const authorIds = [...new Set(questions.map(q => q.authorId))];
  const authors = authorIds.length > 0
    ? await db.select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, bio: usersTable.bio, avatarUrl: usersTable.avatarUrl, role: usersTable.role, createdAt: usersTable.createdAt })
        .from(usersTable).where(sql`${usersTable.id} = ANY(${sql.raw(`ARRAY[${authorIds.join(",")}]`)})`)
    : [];
  const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));

  let userVoteMap: Record<number, number> = {};
  if (req.user) {
    const votes = await db.select().from(votesTable)
      .where(sql`${votesTable.userId} = ${req.user.id} AND ${votesTable.targetType} = 'question'`);
    userVoteMap = Object.fromEntries(votes.map(v => [v.targetId, v.vote]));
  }

  const result = questions.map(q => ({
    ...q,
    tags: q.tags || [],
    author: authorMap[q.authorId],
    userVote: userVoteMap[q.id] ?? null,
  }));

  res.json({ questions: result, total: Number(total), page, limit, totalPages: Math.ceil(Number(total) / limit) });
});

// POST /api/questions
router.post("/", authenticate, async (req: AuthRequest, res) => {
  const { title, body, category, tags } = req.body;
  if (!title || !body || !category) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [question] = await db.insert(questionsTable).values({
    title,
    body,
    category,
    tags: tags || [],
    authorId: req.user!.id,
  }).returning();

  const author = await getUserProfile(req.user!.id);
  res.status(201).json({ ...question, tags: question.tags || [], author, userVote: null });
});

// GET /api/questions/:id
router.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const [question] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!question) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  // increment view count
  await db.update(questionsTable).set({ viewCount: question.viewCount + 1 }).where(eq(questionsTable.id, id));

  const { answersTable } = await import("@workspace/db");
  const [author, answers] = await Promise.all([
    getUserProfile(question.authorId),
    db.select().from(answersTable).where(eq(answersTable.questionId, id)).orderBy(desc(answersTable.isBest), desc(answersTable.votes)),
  ]);

  // fetch answer authors
  const answerAuthorIds = [...new Set(answers.map(a => a.authorId))];
  const answerAuthors = answerAuthorIds.length > 0
    ? await db.select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, bio: usersTable.bio, avatarUrl: usersTable.avatarUrl, role: usersTable.role, createdAt: usersTable.createdAt })
        .from(usersTable).where(sql`${usersTable.id} = ANY(${sql.raw(`ARRAY[${answerAuthorIds.join(",")}]`)})`)
    : [];
  const answerAuthorMap = Object.fromEntries(answerAuthors.map(a => [a.id, a]));

  let userVoteMap: Record<string, number> = {};
  if (req.user) {
    const questionIds = [id];
    const answerIds = answers.map(a => a.id);
    const allIds = [...questionIds, ...answerIds];
    const votes = await db.select().from(votesTable)
      .where(sql`${votesTable.userId} = ${req.user.id} AND ${votesTable.targetId} = ANY(${sql.raw(`ARRAY[${allIds.join(",")}]`)})`);
    for (const v of votes) {
      userVoteMap[`${v.targetType}-${v.targetId}`] = v.vote;
    }
  }

  res.json({
    ...question,
    viewCount: question.viewCount + 1,
    tags: question.tags || [],
    author,
    userVote: userVoteMap[`question-${id}`] ?? null,
    answers: answers.map(a => ({
      ...a,
      author: answerAuthorMap[a.authorId],
      userVote: userVoteMap[`answer-${a.id}`] ?? null,
    })),
  });
});

// PATCH /api/questions/:id
router.patch("/:id", authenticate, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!q) { res.status(404).json({ error: "Not found" }); return; }
  if (q.authorId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { title, body, category, tags } = req.body;
  const updates: any = { updatedAt: new Date() };
  if (title !== undefined) updates.title = title;
  if (body !== undefined) updates.body = body;
  if (category !== undefined) updates.category = category;
  if (tags !== undefined) updates.tags = tags;
  const [updated] = await db.update(questionsTable).set(updates).where(eq(questionsTable.id, id)).returning();
  const author = await getUserProfile(updated.authorId);
  res.json({ ...updated, tags: updated.tags || [], author, userVote: null });
});

// DELETE /api/questions/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!q) { res.status(404).json({ error: "Not found" }); return; }
  if (q.authorId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  await db.delete(questionsTable).where(eq(questionsTable.id, id));
  res.json({ success: true, message: "Question deleted" });
});

// POST /api/questions/:id/vote
router.post("/:id/vote", authenticate, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const vote = Number(req.body.vote);
  if (![1, -1, 0].includes(vote)) {
    res.status(400).json({ error: "Vote must be 1, -1, or 0" }); return;
  }

  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, id));
  if (!q) { res.status(404).json({ error: "Not found" }); return; }

  const [existing] = await db.select().from(votesTable)
    .where(sql`${votesTable.userId} = ${req.user!.id} AND ${votesTable.targetId} = ${id} AND ${votesTable.targetType} = 'question'`);

  const oldVote = existing?.vote ?? 0;
  const delta = vote - oldVote;

  if (vote === 0) {
    await db.delete(votesTable)
      .where(sql`${votesTable.userId} = ${req.user!.id} AND ${votesTable.targetId} = ${id} AND ${votesTable.targetType} = 'question'`);
  } else if (existing) {
    await db.update(votesTable).set({ vote }).where(eq(votesTable.id, existing.id));
  } else {
    await db.insert(votesTable).values({ userId: req.user!.id, targetId: id, targetType: "question", vote });
  }

  const [updated] = await db.update(questionsTable)
    .set({ votes: q.votes + delta })
    .where(eq(questionsTable.id, id))
    .returning();

  res.json({ votes: updated.votes, userVote: vote === 0 ? null : vote });
});

export default router;
