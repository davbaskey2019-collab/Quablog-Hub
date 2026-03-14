import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").notNull().default("Quablog"),
  tagline: text("tagline"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SiteSettings = typeof siteSettingsTable.$inferSelect;
