import { Router } from "express";
import { db, siteSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, requireAdmin, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

async function getOrCreateSettings() {
  const [settings] = await db.select().from(siteSettingsTable);
  if (settings) return settings;
  // create default settings
  const [created] = await db.insert(siteSettingsTable).values({ siteName: "Quablog", tagline: "Ask. Answer. Blog." }).returning();
  return created;
}

// GET /api/settings
router.get("/", async (_req, res) => {
  const settings = await getOrCreateSettings();
  res.json(settings);
});

// PATCH /api/settings
router.patch("/", authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const settings = await getOrCreateSettings();
  const { siteName, tagline, logoUrl, faviconUrl } = req.body;
  const updates: any = { updatedAt: new Date() };
  if (siteName !== undefined) updates.siteName = siteName;
  if (tagline !== undefined) updates.tagline = tagline;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl;
  if (faviconUrl !== undefined) updates.faviconUrl = faviconUrl;

  const [updated] = await db.update(siteSettingsTable).set(updates).where(eq(siteSettingsTable.id, settings.id)).returning();
  res.json(updated);
});

export default router;
