import { 
  users, houses, laws, votes, suggestions, jobs,
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
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Houses
  getHouse(userId: string): Promise<House | undefined>;
  getHouseByCoordinates(x: number, y: number): Promise<House | undefined>;
  getAllHouses(): Promise<HouseWithUser[]>;
  createHouse(userId: string, x: number, y: number): Promise<House>;
  moveHouse(userId: string, x: number, y: number): Promise<House>;
  updateHouseColor(userId: string, color: string): Promise<House>;
  
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

  // Jobs
  getAllJobs(): Promise<any[]>;
  updateUserJob(userId: string, jobId: string): Promise<User>;
  getUsersWithJobs(): Promise<any[]>;
  updateUserLastPaidAt(userId: string): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [createdUser] = await db.insert(users).values(user).returning();
    return createdUser;
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

  async getAllHouses(): Promise<HouseWithUser[]> {
    const result = await db.select({
      id: houses.id,
      userId: houses.userId,
      x: houses.x,
      y: houses.y,
      placedAt: houses.placedAt,
      lastMovedAt: houses.lastMovedAt,
      lastColorChangedAt: houses.lastColorChangedAt,
      color: houses.color,
      username: users.username,
    }).from(houses).leftJoin(users, eq(houses.userId, users.id));
    
    return result.map(r => ({ ...r, username: r.username || 'Unknown' }));
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

  async updateHouseColor(userId: string, color: string): Promise<House> {
    const [house] = await db.update(houses)
      .set({ color, lastColorChangedAt: new Date() })
      .where(eq(houses.userId, userId))
      .returning();
    return house;
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
    const VOTING_DELAY_MS = 24 * 60 * 60 * 1000;
    const VOTING_DURATION_MS = 168 * 60 * 60 * 1000;
    
    const allLaws = await db.select().from(laws);
    const allVotes = await db.select().from(votes);

    for (const law of allLaws) {
      if (law.status === "active" && !law.votingClosedAt) {
        const votingStart = new Date(law.publishedAt.getTime() + VOTING_DELAY_MS);
        const votingEnd = new Date(votingStart.getTime() + VOTING_DURATION_MS);
        const now = new Date();

        if (now >= votingEnd) {
          const lawVotes = allVotes.filter(v => v.lawId === law.id);
          const upvotes = lawVotes.filter(v => v.vote === "up").length;
          const downvotes = lawVotes.filter(v => v.vote === "down").length;

          let newStatus: "passed" | "rejected" | "pending" = "pending";
          let newIsInTiebreak = false;

          if (upvotes > downvotes) {
            newStatus = "passed";
          } else if (downvotes > upvotes) {
            newStatus = "rejected";
          } else {
            newStatus = "pending";
            newIsInTiebreak = true;
          }

          await db.update(laws)
            .set({
              status: newStatus,
              isInTiebreak: newIsInTiebreak,
              votingClosedAt: now,
            })
            .where(eq(laws.id, law.id));
          
          law.status = newStatus;
          law.isInTiebreak = newIsInTiebreak;
          law.votingClosedAt = now;
        }
      }
    }
    
    const lawsWithVotes = allLaws.map(law => {
      const lawVotes = allVotes.filter(v => v.lawId === law.id);
      const upvotes = lawVotes.filter(v => v.vote === "up").length;
      const downvotes = lawVotes.filter(v => v.vote === "down").length;

      const userVoteObject = userId 
        ? lawVotes.find(v => v.userId === userId)
        : null;
      const userVote = userVoteObject?.vote || null;
      const userVotedAt = userVoteObject?.votedAt || undefined;
      
      let isVotable = false;
      let votingEndsAt: Date | undefined;

      if (law.isInTiebreak) {
        isVotable = true;
      } else if (law.status === "active" && !law.votingClosedAt) {
          const votingStart = new Date(law.publishedAt.getTime() + VOTING_DELAY_MS);
          votingEndsAt = new Date(votingStart.getTime() + VOTING_DURATION_MS);
          const now = new Date();
          isVotable = now >= votingStart && now < votingEndsAt;
      }
      
      return {
        ...law,
        upvotes,
        downvotes,
        userVote,
        userVotedAt,
        isVotable,
        votingEndsAt,
      };
    });

    lawsWithVotes.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return b.publishedAt.getTime() - a.publishedAt.getTime();
    });

    return lawsWithVotes;
  }

  async createLaw(law: InsertLaw): Promise<Law> {
    const [newLaw] = await db.insert(laws).values(law).returning();
    return newLaw;
  }

  async closeLawVoting(id: string): Promise<void> {
    const lawVotes = await db.select().from(votes).where(eq(votes.lawId, id));
    const upvotes = lawVotes.filter(v => v.vote === "up").length;
    const downvotes = lawVotes.filter(v => v.vote === "down").length;

    let finalStatus: "passed" | "rejected" = "rejected";
    if (upvotes > downvotes) {
      finalStatus = "passed";
    } else if (downvotes > upvotes) {
      finalStatus = "rejected";
    }

    await db.update(laws)
      .set({ 
        votingClosedAt: new Date(), 
        isInTiebreak: false,
        status: finalStatus
      })
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

  // Jobs
  async getAllJobs(): Promise<any[]> {
    return db.select().from(jobs);
  }

  async updateUserJob(userId: string, jobId: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ jobId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUsersWithJobs(): Promise<any[]> {
    return db.select({
      user: users,
      job: jobs,
    }).from(users).innerJoin(jobs, eq(users.jobId, jobs.id));
  }

  async updateUserLastPaidAt(userId: string): Promise<User> {
    const [user] = await db.update(users)
      .set({ lastPaidAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
