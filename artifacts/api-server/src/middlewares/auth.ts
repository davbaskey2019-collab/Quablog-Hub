import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "quablog-super-secret-key-2024";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    email: string;
    username: string;
  };
}

export function generateToken(userId: number, role: string, email: string, username: string): string {
  return jwt.sign({ id: userId, role, email, username }, JWT_SECRET, { expiresIn: "7d" });
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized", message: "No token provided" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string; email: string; username: string };
    // verify user still exists and is not blocked
    const [user] = await db.select({ id: usersTable.id, role: usersTable.role, email: usersTable.email, username: usersTable.username, isBlocked: usersTable.isBlocked })
      .from(usersTable).where(eq(usersTable.id, payload.id));
    if (!user) {
      res.status(401).json({ error: "Unauthorized", message: "User not found" });
      return;
    }
    if (user.isBlocked) {
      res.status(403).json({ error: "Forbidden", message: "Account is blocked" });
      return;
    }
    req.user = { id: user.id, role: user.role, email: user.email, username: user.username };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "Forbidden", message: "Admin access required" });
    return;
  }
  next();
}

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number; role: string; email: string; username: string };
    req.user = payload;
  } catch {
    // ignore invalid token for optional auth
  }
  next();
};
