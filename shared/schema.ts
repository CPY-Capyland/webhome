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
  jobId: varchar("job_id", { length: 36 }).references(() => jobs.id),
  lastPaidAt: timestamp("last_paid_at"),
  balance: integer("balance").default(0).notNull(),
  jobStoppedAt: timestamp("job_stopped_at"),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: text("name").notNull(),
  grossSalary: integer("gross_salary").notNull(),
  fees: integer("fees").notNull(),
  justification: text("justification"),
});

// Houses table - one per user on the 500x500 grid
export const houses = pgTable("houses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id).unique(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  size: integer("size").default(1).notNull(),
  placedAt: timestamp("placed_at").defaultNow().notNull(),
  lastMovedAt: timestamp("last_moved_at").defaultNow().notNull(),
  lastColorChangedAt: timestamp("last_color_changed_at").defaultNow().notNull(),
  color: text("color").default('#FF0000').notNull(),
}, (table) => [
  uniqueIndex("houses_coordinates_idx").on(table.x, table.y),
]);

// Laws table - published by government
export const laws = pgTable("laws", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
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
export const insertElectionSchema = createInsertSchema(elections);
export const insertCandidateSchema = createInsertSchema(candidates);
export const insertElectionVoteSchema = createInsertSchema(electionVotes);

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

export type InsertElection = z.infer<typeof insertElectionSchema>;
export type Election = typeof elections.$inferSelect;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export type InsertElectionVote = z.infer<typeof insertElectionVoteSchema>;
export type ElectionVote = typeof electionVotes.$inferSelect;

// API response types
export type HouseWithUser = House & { 
  isCurrentUser?: boolean;
  username: string;
  color: string;
  lastColorChangedAt: Date;
};
export type LawWithVotes = Law & { 
  upvotes: number; 
  downvotes: number; 
  userVote?: "up" | "down" | null;
  userVotedAt?: Date;
  isVotable?: boolean;
  votingEndsAt?: Date;
  isInTiebreak?: boolean;
  publisherName?: string;
};

// Elections
export const elections = pgTable("elections", {
  id: varchar("id", { length: 36 }).primaryKey(),
  startDate: timestamp("start_date").notNull(),
  status: text("status", { enum: ["candidacy", "campaign", "voting", "closed"] }).notNull().default("candidacy"),
  winnerId: varchar("winner_id", { length: 36 }).references(() => users.id),
  mandateEndDate: timestamp("mandate_end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const electionVotes = pgTable("election_votes", {
  id: varchar("id", { length: 36 }).primaryKey(),
  electionId: varchar("election_id", { length: 36 }).notNull().references(() => elections.id),
  voterId: varchar("voter_id", { length: 36 }).notNull().references(() => users.id),
  candidateId: varchar("candidate_id", { length: 36 }).references(() => candidates.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
export const candidates = pgTable("candidates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  electionId: varchar("election_id", { length: 36 }).notNull().references(() => elections.id),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  platform: text("platform").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});