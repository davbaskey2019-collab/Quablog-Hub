import { Router } from "express";
import { db, usersTable, blogsTable } from "@workspace/db";
import { eq, ilike, or, sql, count, desc } from "drizzle-orm";
import { authenticate, optionalAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
}

function calcReadTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
}

async function getAuthorProfile(authorId: number) {
  const [user] = await db.select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, bio: usersTable.bio, avatarUrl: usersTable.avatarUrl, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable).where(eq(usersTable.id, authorId));
  return user;
}

// GET /api/blogs
router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 12);
  const offset = (page - 1) * limit;
  const category = req.query.category as string | undefined;
  const search = req.query.search as string | undefined;
  const statusFilter = req.query.status as string | undefined;

  let query = db.select().from(blogsTable);
  let countQuery = db.select({ count: count() }).from(blogsTable);

  const conditions: any[] = [];
  // only admins can see drafts
  if (!req.user || req.user.role !== "admin") {
    conditions.push(sql`${blogsTable.status} = 'published'`);
  } else if (statusFilter) {
    conditions.push(eq(blogsTable.status, statusFilter));
  }
  if (category) conditions.push(eq(blogsTable.category, category));
  if (search) {
    conditions.push(or(ilike(blogsTable.title, `%${search}%`), ilike(blogsTable.excerpt, `%${search}%`)));
  }

  if (conditions.length === 1) {
    query = query.where(conditions[0]) as any;
    countQuery = countQuery.where(conditions[0]) as any;
  } else if (conditions.length > 1) {
    const combined = conditions.reduce((a: any, b: any) => sql`${a} AND ${b}`);
    query = query.where(combined) as any;
    countQuery = countQuery.where(combined) as any;
  }

  const [blogs, [{ count: total }]] = await Promise.all([
    query.limit(limit).offset(offset).orderBy(desc(blogsTable.createdAt)),
    countQuery,
  ]);

  const authorIds = [...new Set(blogs.map(b => b.authorId))];
  const authors = authorIds.length > 0
    ? await db.select({ id: usersTable.id, username: usersTable.username, displayName: usersTable.displayName, bio: usersTable.bio, avatarUrl: usersTable.avatarUrl, role: usersTable.role, createdAt: usersTable.createdAt })
        .from(usersTable).where(sql`${usersTable.id} = ANY(${sql.raw(`ARRAY[${authorIds.join(",")}]`)})`)
    : [];
  const authorMap = Object.fromEntries(authors.map(a => [a.id, a]));

  res.json({
    blogs: blogs.map(b => ({ ...b, tags: b.tags || [], author: authorMap[b.authorId] })),
    total: Number(total),
    page,
    limit,
    totalPages: Math.ceil(Number(total) / limit),
  });
});

// POST /api/blogs
router.post("/", authenticate, async (req: AuthRequest, res) => {
  const { title, content, excerpt, coverImageUrl, category, tags, status } = req.body;
  if (!title || !content || !category) {
    res.status(400).json({ error: "Missing required fields: title, content, category" }); return;
  }
  const slug = generateSlug(title);
  const readTime = calcReadTime(content);
  const [blog] = await db.insert(blogsTable).values({
    title,
    slug,
    content,
    excerpt: excerpt || content.slice(0, 200) + "...",
    coverImageUrl: coverImageUrl || null,
    category,
    tags: tags || [],
    status: status || "draft",
    readTime,
    authorId: req.user!.id,
  }).returning();
  const author = await getAuthorProfile(req.user!.id);
  res.status(201).json({ ...blog, tags: blog.tags || [], author });
});

// GET /api/blogs/:id
router.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const [blog] = await db.select().from(blogsTable).where(eq(blogsTable.id, id));
  if (!blog) { res.status(404).json({ error: "Not found" }); return; }
  if (blog.status === "draft" && (!req.user || (req.user.id !== blog.authorId && req.user.role !== "admin"))) {
    res.status(404).json({ error: "Not found" }); return;
  }
  const author = await getAuthorProfile(blog.authorId);
  res.json({ ...blog, tags: blog.tags || [], author });
});

// PATCH /api/blogs/:id
router.patch("/:id", authenticate, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const [b] = await db.select().from(blogsTable).where(eq(blogsTable.id, id));
  if (!b) { res.status(404).json({ error: "Not found" }); return; }
  if (b.authorId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  const { title, content, excerpt, coverImageUrl, category, tags, status } = req.body;
  const updates: any = { updatedAt: new Date() };
  if (title !== undefined) updates.title = title;
  if (content !== undefined) { updates.content = content; updates.readTime = calcReadTime(content); }
  if (excerpt !== undefined) updates.excerpt = excerpt;
  if (coverImageUrl !== undefined) updates.coverImageUrl = coverImageUrl;
  if (category !== undefined) updates.category = category;
  if (tags !== undefined) updates.tags = tags;
  if (status !== undefined) updates.status = status;

  const [updated] = await db.update(blogsTable).set(updates).where(eq(blogsTable.id, id)).returning();
  const author = await getAuthorProfile(updated.authorId);
  res.json({ ...updated, tags: updated.tags || [], author });
});

// DELETE /api/blogs/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const [b] = await db.select().from(blogsTable).where(eq(blogsTable.id, id));
  if (!b) { res.status(404).json({ error: "Not found" }); return; }
  if (b.authorId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ error: "Forbidden" }); return;
  }
  await db.delete(blogsTable).where(eq(blogsTable.id, id));
  res.json({ success: true, message: "Blog deleted" });
});

export default router;
