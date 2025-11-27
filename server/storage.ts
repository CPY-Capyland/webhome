import { 
  users, houses, laws, votes, suggestions,
  type User, type InsertUser,
  type House, type InsertHouse,
  type Law, type InsertLaw,
  type Vote, type InsertVote,
  type Suggestion, type InsertSuggestion,
  type LawWithVotes
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserBySessionId(sessionId: string): Promise<User | undefined>;
  createUser(sessionId: string): Promise<User>;
  
  // Houses
  getHouse(userId: string): Promise<House | undefined>;
  getHouseByCoordinates(x: number, y: number): Promise<House | undefined>;
  getAllHouses(): Promise<House[]>;
  createHouse(userId: string, x: number, y: number): Promise<House>;
  moveHouse(userId: string, x: number, y: number): Promise<House>;
  
  // Laws
  getLaw(id: string): Promise<Law | undefined>;
  getAllLaws(): Promise<Law[]>;
  getLawsWithVotes(userId?: string): Promise<LawWithVotes[]>;
  createLaw(law: InsertLaw): Promise<Law>;
  closeLawVoting(id: string): Promise<void>;
  
  // Votes
  getVote(lawId: string, userId: string): Promise<Vote | undefined>;
  createOrUpdateVote(lawId: string, userId: string, vote: "up" | "down"): Promise<Vote>;
  deleteVote(lawId: string, userId: string): Promise<void>;
  
  // Suggestions
  createSuggestion(userId: string, title: string, text: string): Promise<Suggestion>;
  getAllSuggestions(): Promise<Suggestion[]>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserBySessionId(sessionId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.sessionId, sessionId));
    return user || undefined;
  }

  async createUser(sessionId: string): Promise<User> {
    const id = randomUUID();
    const [user] = await db.insert(users).values({ id, sessionId }).returning();
    return user;
  }

  // Houses
  async getHouse(userId: string): Promise<House | undefined> {
    const [house] = await db.select().from(houses).where(eq(houses.userId, userId));
    return house || undefined;
  }

  async getHouseByCoordinates(x: number, y: number): Promise<House | undefined> {
    const [house] = await db.select().from(houses).where(
      and(eq(houses.x, x), eq(houses.y, y))
    );
    return house || undefined;
  }

  async getAllHouses(): Promise<House[]> {
    return db.select().from(houses);
  }

  async createHouse(userId: string, x: number, y: number): Promise<House> {
    const id = randomUUID();
    const now = new Date();
    try {
      const [house] = await db.insert(houses).values({ 
        id, 
        userId, 
        x, 
        y,
        placedAt: now,
        lastMovedAt: now
      }).returning();
      return house;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error("DUPLICATE_ENTRY");
      }
      throw error;
    }
  }

  async moveHouse(userId: string, x: number, y: number): Promise<House> {
    try {
      const [house] = await db.update(houses)
        .set({ x, y, lastMovedAt: new Date() })
        .where(eq(houses.userId, userId))
        .returning();
      return house;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new Error("DUPLICATE_ENTRY");
      }
      throw error;
    }
  }

  // Laws
  async getLaw(id: string): Promise<Law | undefined> {
    const [law] = await db.select().from(laws).where(eq(laws.id, id));
    return law || undefined;
  }

  async getAllLaws(): Promise<Law[]> {
    return db.select().from(laws);
  }

  async getLawsWithVotes(userId?: string): Promise<LawWithVotes[]> {
    const VOTING_DURATION_MS = 72 * 60 * 60 * 1000;
    const allLaws = await db.select().from(laws);
    const allVotes = await db.select().from(votes);
    
    return allLaws.map(law => {
      const lawVotes = allVotes.filter(v => v.lawId === law.id);
      const upvotes = lawVotes.filter(v => v.vote === "up").length;
      const downvotes = lawVotes.filter(v => v.vote === "down").length;
      const userVote = userId 
        ? lawVotes.find(v => v.userId === userId)?.vote || null 
        : null;
      
      // Calculate votable status
      let isVotable = law.status === "active";
      let votingEndsAt: Date | undefined;
      
      if (isVotable) {
        if (law.votingClosedAt) {
          isVotable = law.isInTiebreak;
        } else {
          votingEndsAt = new Date(law.publishedAt.getTime() + VOTING_DURATION_MS);
          isVotable = new Date() < votingEndsAt;
        }
      }
      
      return {
        ...law,
        upvotes,
        downvotes,
        userVote,
        isVotable,
        votingEndsAt,
        isInTiebreak: law.isInTiebreak,
      };
    });
  }

  async createLaw(law: InsertLaw): Promise<Law> {
    const [newLaw] = await db.insert(laws).values(law).returning();
    return newLaw;
  }

  async closeLawVoting(id: string): Promise<void> {
    await db.update(laws)
      .set({ votingClosedAt: new Date(), isInTiebreak: false })
      .where(eq(laws.id, id));
  }

  // Votes
  async getVote(lawId: string, userId: string): Promise<Vote | undefined> {
    const [vote] = await db.select().from(votes).where(
      and(eq(votes.lawId, lawId), eq(votes.userId, userId))
    );
    return vote || undefined;
  }

  async createOrUpdateVote(lawId: string, userId: string, vote: "up" | "down"): Promise<Vote> {
    const existingVote = await this.getVote(lawId, userId);
    
    if (existingVote) {
      const [updated] = await db.update(votes)
        .set({ vote, votedAt: new Date() })
        .where(eq(votes.id, existingVote.id))
        .returning();
      return updated;
    }
    
    const id = randomUUID();
    const [newVote] = await db.insert(votes).values({
      id,
      lawId,
      userId,
      vote,
    }).returning();
    return newVote;
  }

  async deleteVote(lawId: string, userId: string): Promise<void> {
    await db.delete(votes).where(
      and(eq(votes.lawId, lawId), eq(votes.userId, userId))
    );
  }

  // Suggestions
  async createSuggestion(userId: string, title: string, text: string): Promise<Suggestion> {
    const id = randomUUID();
    const [suggestion] = await db.insert(suggestions).values({
      id,
      userId,
      title,
      text,
    }).returning();
    return suggestion;
  }

  async getAllSuggestions(): Promise<Suggestion[]> {
    return db.select().from(suggestions);
  }
}

export const storage = new DatabaseStorage();
