import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { questionsTable } from "./questions";

export const answersTable = pgTable("answers", {
  id: serial("id").primaryKey(),
  body: text("body").notNull(),
  votes: integer("votes").notNull().default(0),
  isBest: boolean("is_best").notNull().default(false),
  questionId: integer("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAnswerSchema = createInsertSchema(answersTable).omit({ id: true, votes: true, isBest: true, createdAt: true, updatedAt: true });
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answersTable.$inferSelect;
