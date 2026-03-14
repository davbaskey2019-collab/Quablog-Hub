import { Router } from "express";
import { db, usersTable, answersTable, questionsTable, votesTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth.js";

const router = Router({ mergeParams: true });

// POST /api/questions/:questionId/answers
router.post("/", authenticate, async (req: AuthRequest, res) => {
  const questionId = Number(req.params.questionId);
  const [q] = await db.select().from(questionsTable).where(eq(questionsTable.id, questionId));
  if (!q) { res.status(404).json({ error: "Question not found" }); return; }

  const { body } = req.body;
  if (!body || body.length < 10) {
    res.status(400).json({ error: "Answer must be at least 10 characters" }); return;
  }

  const [answer] = await db.insert(answersTable).values({
    body,
    questionId,
    authorId: req.user!.id,
  }).returning();

  // update answer count on question
  await db.update(questionsTable).set({ answerCount: q.answerCount + 1 }).where(eq(questionsTable.id, questionId));

  const [author] = await db.select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, bio: usersTable.bio, avatarUrl: usersTable.avatarUrl, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable).where(eq(usersTable.id, req.user!.id));

  res.status(201).json({ ...answer, author, userVote: null });
});

export default router;
