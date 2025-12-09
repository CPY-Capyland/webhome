import { pgTable, text, varchar, integer, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - simple session-based identification
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sessionId: text("session_id").notNull(), // Add this line
  discordId: text("discord_id").notNull().unique(), // notNull().unique()
  username: text("username").notNull(), // notNull()
  avatar: text("avatar"), // nullable
  createdAt: timestamp("created_at").defaultNow().notNull(), // defaultNow().notNull()
});

// Houses table - one per user on the 500x500 grid
export const houses = pgTable("houses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id).unique(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  placedAt: timestamp("placed_at").defaultNow().notNull(),
  lastMovedAt: timestamp("last_moved_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("houses_coordinates_idx").on(table.x, table.y),
]);

// Laws table - published by government
export const laws = pgTable("laws", {
  id: varchar("id", { length: 36 }).primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  fullText: text("full_text").notNull(),
  status: text("status", { enum: ["active", "pending", "passed", "rejected"] }).notNull().default("active"),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  votingClosedAt: timestamp("voting_closed_at"),
  isInTiebreak: boolean("is_in_tiebreak").default(false).notNull(),
});

// Votes table - user votes on laws
export const votes = pgTable("votes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  lawId: varchar("law_id", { length: 36 }).notNull().references(() => laws.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  vote: text("vote", { enum: ["up", "down"] }).notNull(),
  votedAt: timestamp("voted_at").defaultNow().notNull(),
});

// Suggestions table - proposals from users
export const suggestions = pgTable("suggestions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  title: text("title").notNull(),
  text: text("text").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewed: boolean("reviewed").default(false).notNull(),
});

export const userSessions = pgTable("user_sessions", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire", { withTimezone: true }).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  house: one(houses, {
    fields: [users.id],
    references: [houses.userId],
  }),
  votes: many(votes),
  suggestions: many(suggestions),
}));

export const housesRelations = relations(houses, ({ one }) => ({
  user: one(users, {
    fields: [houses.userId],
    references: [users.id],
  }),
}));

export const lawsRelations = relations(laws, ({ many }) => ({
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  law: one(laws, {
    fields: [votes.lawId],
    references: [laws.id],
  }),
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

export const suggestionsRelations = relations(suggestions, ({ one }) => ({
  user: one(users, {
    fields: [suggestions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true });
export const insertHouseSchema = createInsertSchema(houses).omit({ placedAt: true, lastMovedAt: true });
export const insertLawSchema = createInsertSchema(laws).omit({ publishedAt: true });
export const insertVoteSchema = createInsertSchema(votes).omit({ votedAt: true });
export const insertSuggestionSchema = createInsertSchema(suggestions).omit({ submittedAt: true, reviewed: true });
export const insertUserSessionSchema = createInsertSchema(userSessions);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;

export type InsertHouse = z.infer<typeof insertHouseSchema>;
export type House = typeof houses.$inferSelect;

export type InsertLaw = z.infer<typeof insertLawSchema>;
export type Law = typeof laws.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Suggestion = typeof suggestions.$inferSelect;

// API response types
export type HouseWithUser = House & { 
  isCurrentUser?: boolean;
  username: string; 
};
export type LawWithVotes = Law & { 
  upvotes: number; 
  downvotes: number; 
  userVote?: "up" | "down" | null;
  userVotedAt?: Date;
  isVotable?: boolean;
  votingEndsAt?: Date;
  isInTiebreak?: boolean;
};