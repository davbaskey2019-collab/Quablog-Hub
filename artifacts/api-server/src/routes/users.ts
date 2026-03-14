import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, questionsTable, answersTable, blogsTable } from "@workspace/db";
import { eq, ilike, or, sql, count } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

function safeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

// GET /api/users — admin only
router.get("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const search = req.query.search as string | undefined;
  const offset = (page - 1) * limit;

  let query = db.select().from(usersTable);
  let countQuery = db.select({ count: count() }).from(usersTable);

  if (search) {
    const like = `%${search}%`;
    const where = or(ilike(usersTable.username, like), ilike(usersTable.email, like), ilike(usersTable.displayName, like));
    query = query.where(where) as any;
    countQuery = countQuery.where(where) as any;
  }

  const [users, [{ count: total }]] = await Promise.all([
    query.limit(limit).offset(offset).orderBy(usersTable.createdAt),
    countQuery,
  ]);

  res.json({
    users: users.map(safeUser),
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  });
});

// GET /api/users/:id — public
router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [qCount, aCount, bCount] = await Promise.all([
    db.select({ count: count() }).from(questionsTable).where(eq(questionsTable.authorId, id)),
    db.select({ count: count() }).from(answersTable).where(eq(answersTable.authorId, id)),
    db.select({ count: count() }).from(blogsTable).where(eq(blogsTable.authorId, id)),
  ]);

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
    _count: {
      questions: Number(qCount[0].count),
      answers: Number(aCount[0].count),
      blogs: Number(bCount[0].count),
    },
  });
});

// PATCH /api/users/:id
router.patch("/:id", authenticate, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  // only self or admin can update
  if (req.user!.id !== id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { displayName, bio, avatarUrl, email, password } = req.body;
  const updates: Record<string, any> = { updatedAt: new Date() };
  if (displayName !== undefined) updates.displayName = displayName;
  if (bio !== undefined) updates.bio = bio;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  if (email !== undefined) updates.email = email;
  if (password !== undefined) updates.passwordHash = await bcrypt.hash(password, 10);

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, id)).returning();
  if (!updated) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(safeUser(updated));
});

// DELETE /api/users/:id — admin only
router.delete("/:id", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.json({ success: true, message: "User deleted" });
});

// POST /api/users/:id/block — admin only
router.post("/:id/block", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const { blocked } = req.body;
  await db.update(usersTable).set({ isBlocked: Boolean(blocked), updatedAt: new Date() }).where(eq(usersTable.id, id));
  res.json({ success: true, message: blocked ? "User blocked" : "User unblocked" });
});

export default router;
