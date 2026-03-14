import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, questionsTable, answersTable, blogsTable } from "@workspace/db";
import { eq, sql, count, gte } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

// GET /api/admin/stats
router.get("/stats", authenticate, requireAdmin, async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    [{ count: totalUsers }],
    [{ count: totalQuestions }],
    [{ count: totalAnswers }],
    [{ count: totalBlogs }],
    [{ count: newUsersToday }],
    [{ count: newQuestionsToday }],
    [{ count: newBlogsToday }],
    recentUsers,
    recentQuestions,
    recentBlogs,
  ] = await Promise.all([
    db.select({ count: count() }).from(usersTable),
    db.select({ count: count() }).from(questionsTable),
    db.select({ count: count() }).from(answersTable),
    db.select({ count: count() }).from(blogsTable),
    db.select({ count: count() }).from(usersTable).where(gte(usersTable.createdAt, today)),
    db.select({ count: count() }).from(questionsTable).where(gte(questionsTable.createdAt, today)),
    db.select({ count: count() }).from(blogsTable).where(gte(blogsTable.createdAt, today)),
    db.select({ id: usersTable.id, username: usersTable.username, email: usersTable.email, displayName: usersTable.displayName, role: usersTable.role, isBlocked: usersTable.isBlocked, createdAt: usersTable.createdAt, avatarUrl: usersTable.avatarUrl })
      .from(usersTable).orderBy(sql`${usersTable.createdAt} DESC`).limit(5),
    db.select().from(questionsTable).orderBy(sql`${questionsTable.createdAt} DESC`).limit(5),
    db.select().from(blogsTable).orderBy(sql`${blogsTable.createdAt} DESC`).limit(5),
  ]);

  // fetch authors for questions and blogs
  const allAuthorIds = [
    ...new Set([...recentQuestions.map((q: any) => q.authorId), ...recentBlogs.map((b: any) => b.authorId)]),
  ];
  const authors = allAuthorIds.length > 0
    ? await db.select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, bio: usersTable.bio, avatarUrl: usersTable.avatarUrl, role: usersTable.role, createdAt: usersTable.createdAt })
        .from(usersTable).where(sql`${usersTable.id} = ANY(${sql.raw(`ARRAY[${allAuthorIds.join(",")}]`)})`)
    : [];
  const authorMap = Object.fromEntries(authors.map((a: any) => [a.id, a]));

  res.json({
    totalUsers: Number(totalUsers),
    totalQuestions: Number(totalQuestions),
    totalAnswers: Number(totalAnswers),
    totalBlogs: Number(totalBlogs),
    newUsersToday: Number(newUsersToday),
    newQuestionsToday: Number(newQuestionsToday),
    newBlogsToday: Number(newBlogsToday),
    recentUsers,
    recentQuestions: recentQuestions.map((q: any) => ({ ...q, tags: q.tags || [], author: authorMap[q.authorId] })),
    recentBlogs: recentBlogs.map((b: any) => ({ ...b, tags: b.tags || [], author: authorMap[b.authorId] })),
  });
});

// PATCH /api/admin/profile
router.patch("/profile", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const { email, currentPassword, newPassword } = req.body;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  if (newPassword) {
    if (!currentPassword) {
      res.status(400).json({ error: "Current password required to set new password" }); return;
    }
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) {
      res.status(400).json({ error: "Current password is incorrect" }); return;
    }
  }

  const updates: any = { updatedAt: new Date() };
  if (email !== undefined) updates.email = email;
  if (newPassword) updates.passwordHash = await bcrypt.hash(newPassword, 10);

  await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.id));
  res.json({ success: true, message: "Profile updated" });
});

export default router;
