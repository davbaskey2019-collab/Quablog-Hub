import { pgTable, serial, integer, timestamp, text, unique } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// Tracks votes on questions and answers
export const votesTable = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  targetId: integer("target_id").notNull(), // question or answer id
  targetType: text("target_type").notNull(), // 'question' | 'answer'
  vote: integer("vote").notNull(), // 1 or -1
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.targetId, t.targetType)]);

export type Vote = typeof votesTable.$inferSelect;
