import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { generateToken, authenticate, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }
  const { username, email, password, displayName } = parsed.data;

  // check uniqueness
  const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Conflict", message: "Email already in use" });
    return;
  }
  const [existingUsername] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, username));
  if (existingUsername) {
    res.status(409).json({ error: "Conflict", message: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    username,
    email,
    passwordHash,
    displayName,
    role: "user",
  }).returning();

  const token = generateToken(user.id, user.role, user.email, user.username);
  res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    },
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }
  if (user.isBlocked) {
    res.status(403).json({ error: "Forbidden", message: "Account is blocked" });
    return;
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  const token = generateToken(user.id, user.role, user.email, user.username);
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    },
  });
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    role: user.role,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
  });
});

export default router;
