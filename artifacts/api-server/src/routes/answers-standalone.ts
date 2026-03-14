import { Router } from "express";
import { db, usersTable, answersTable, questionsTable, votesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

// PATCH /api/answers/:id
router.patch("/:id", authenticate, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const [a] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!a) { res.status(404).json({ error: "Not found" }); return; }
  if (a.authorId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { body } = req.body;
  if (!body) { res.status(400).json({ error: "Body required" }); return; }
  const [updated] = await db.update(answersTable).set({ body, updatedAt: new Date() }).where(eq(answersTable.id, id)).returning();
  const [author] = await db.select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, bio: usersTable.bio, avatarUrl: usersTable.avatarUrl, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable).where(eq(usersTable.id, updated.authorId));
  res.json({ ...updated, author, userVote: null });
});

// DELETE /api/answers/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const [a] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!a) { res.status(404).json({ error: "Not found" }); return; }
  if (a.authorId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  // decrement answer count
  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, a.questionId));
  if (q) {
    await db.update(questionsTable).set({ answerCount: Math.max(0, q.answerCount - 1) }).where(eq(questionsTable.id, a.questionId));
  }
  await db.delete(answersTable).where(eq(answersTable.id, id));
  res.json({ success: true, message: "Answer deleted" });
});

// POST /api/answers/:id/vote
router.post("/:id/vote", authenticate, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const vote = Number(req.body.vote);
  if (![1, -1, 0].includes(vote)) {
    res.status(400).json({ error: "Vote must be 1, -1, or 0" }); return;
  }

  const [a] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!a) { res.status(404).json({ error: "Not found" }); return; }

  const [existing] = await db.select().from(votesTable)
    .where(sql`${votesTable.userId} = ${req.user!.id} AND ${votesTable.targetId} = ${id} AND ${votesTable.targetType} = 'answer'`);

  const oldVote = existing?.vote ?? 0;
  const delta = vote - oldVote;

  if (vote === 0) {
    await db.delete(votesTable)
      .where(sql`${votesTable.userId} = ${req.user!.id} AND ${votesTable.targetId} = ${id} AND ${votesTable.targetType} = 'answer'`);
  } else if (existing) {
    await db.update(votesTable).set({ vote }).where(eq(votesTable.id, existing.id));
  } else {
    await db.insert(votesTable).values({ userId: req.user!.id, targetId: id, targetType: "answer", vote });
  }

  const [updated] = await db.update(answersTable).set({ votes: a.votes + delta }).where(eq(answersTable.id, id)).returning();
  res.json({ votes: updated.votes, userVote: vote === 0 ? null : vote });
});

// POST /api/answers/:id/best
router.post("/:id/best", authenticate, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const [a] = await db.select().from(answersTable).where(eq(answersTable.id, id));
  if (!a) { res.status(404).json({ error: "Not found" }); return; }

  // verify requester is question author or admin
  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, a.questionId));
  if (!q) { res.status(404).json({ error: "Question not found" }); return; }
  if (q.authorId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Only the question author can mark the best answer" }); return;
  }

  // unmark any existing best answer for this question
  await db.update(answersTable).set({ isBest: false }).where(eq(answersTable.questionId, a.questionId));
  // mark this one
  await db.update(answersTable).set({ isBest: true }).where(eq(answersTable.id, id));
  // mark question as having a best answer
  await db.update(questionsTable).set({ hasBestAnswer: true }).where(eq(questionsTable.id, a.questionId));

  res.json({ success: true, message: "Best answer marked" });
});

export default router;
