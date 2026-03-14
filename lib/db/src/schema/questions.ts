import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull(),
  tags: json("tags").$type<string[]>().notNull().default([]),
  votes: integer("votes").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  answerCount: integer("answer_count").notNull().default(0),
  hasBestAnswer: boolean("has_best_answer").notNull().default(false),
  authorId: integer("author_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, votes: true, viewCount: true, answerCount: true, hasBestAnswer: true, createdAt: true, updatedAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
