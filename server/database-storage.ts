import { 
  User, InsertUser, Team, InsertTeam, Booking, InsertBooking,
  PlayerBooking, InsertPlayerBooking, MatchStats, InsertMatchStats,
  PlayerStats, InsertPlayerStats, Achievement, PlayerAchievement,
  users, teams, bookings, playerBookings, matchStats, playerStats,
  achievements, playerAchievements
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(update)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Teams
  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async getTeamsByOwner(ownerId: number): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.ownerId, ownerId));
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const [team] = await db.insert(teams).values(insertTeam).returning();
    return team;
  }

  async updateTeam(id: number, update: Partial<Team>): Promise<Team | undefined> {
    const [team] = await db.update(teams)
      .set(update)
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  // Bookings
  async getBooking(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async getBookingsByTeam(teamId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.teamId, teamId));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db.insert(bookings).values(insertBooking).returning();
    return booking;
  }

  async updateBooking(id: number, update: Partial<Booking>): Promise<Booking | undefined> {
    const [booking] = await db.update(bookings)
      .set(update)
      .where(eq(bookings.id, id))
      .returning();
    return booking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    try {
      const result = await db.delete(bookings).where(eq(bookings.id, id));
      return !!result.rowCount;
    } catch (error) {
      console.error("Error deleting booking:", error);
      return false;
    }
  }

  // Player Bookings
  async getPlayerBooking(id: number): Promise<PlayerBooking | undefined> {
    const [playerBooking] = await db.select().from(playerBookings).where(eq(playerBookings.id, id));
    return playerBooking;
  }

  async getPlayerBookingsByBooking(bookingId: number): Promise<PlayerBooking[]> {
    return await db.select().from(playerBookings).where(eq(playerBookings.bookingId, bookingId));
  }

  async getPlayerBookingsByPlayer(playerId: number): Promise<PlayerBooking[]> {
    return await db.select().from(playerBookings).where(eq(playerBookings.playerId, playerId));
  }

  async createPlayerBooking(insertPlayerBooking: InsertPlayerBooking): Promise<PlayerBooking> {
    const [playerBooking] = await db.insert(playerBookings).values(insertPlayerBooking).returning();
    return playerBooking;
  }

  async updatePlayerBooking(id: number, update: Partial<PlayerBooking>): Promise<PlayerBooking | undefined> {
    const [playerBooking] = await db.update(playerBookings)
      .set(update)
      .where(eq(playerBookings.id, id))
      .returning();
    return playerBooking;
  }

  async deletePlayerBooking(id: number): Promise<boolean> {
    try {
      const result = await db.delete(playerBookings).where(eq(playerBookings.id, id));
      return !!result.rowCount;
    } catch (error) {
      console.error("Error deleting player booking:", error);
      return false;
    }
  }

  // Match Stats
  async getMatchStats(id: number): Promise<MatchStats | undefined> {
    const [stats] = await db.select().from(matchStats).where(eq(matchStats.id, id));
    return stats;
  }

  async getMatchStatsByBooking(bookingId: number): Promise<MatchStats | undefined> {
    const [stats] = await db.select().from(matchStats).where(eq(matchStats.bookingId, bookingId));
    return stats;
  }

  async createMatchStats(insertMatchStats: InsertMatchStats): Promise<MatchStats> {
    const [stats] = await db.insert(matchStats).values(insertMatchStats).returning();
    return stats;
  }

  async updateMatchStats(id: number, update: Partial<MatchStats>): Promise<MatchStats | undefined> {
    const [stats] = await db.update(matchStats)
      .set(update)
      .where(eq(matchStats.id, id))
      .returning();
    return stats;
  }

  // Player Stats
  async getPlayerStats(id: number): Promise<PlayerStats | undefined> {
    const [stats] = await db.select().from(playerStats).where(eq(playerStats.id, id));
    return stats;
  }

  async getPlayerStatsByPlayer(playerId: number): Promise<PlayerStats[]> {
    return await db.select().from(playerStats).where(eq(playerStats.playerId, playerId));
  }

  async getPlayerStatsByBooking(bookingId: number): Promise<PlayerStats[]> {
    return await db.select().from(playerStats).where(eq(playerStats.bookingId, bookingId));
  }

  async createPlayerStats(insertPlayerStats: InsertPlayerStats): Promise<PlayerStats> {
    const [stats] = await db.insert(playerStats).values(insertPlayerStats).returning();
    return stats;
  }

  async updatePlayerStats(id: number, update: Partial<PlayerStats>): Promise<PlayerStats | undefined> {
    const [stats] = await db.update(playerStats)
      .set(update)
      .where(eq(playerStats.id, id))
      .returning();
    return stats;
  }

  // Stripe
  async updateUserStripeInfo(userId: number, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Team Members
  async getTeamMembers(teamId: number): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.teamId, teamId));
  }

  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getPlayerAchievements(playerId: number): Promise<{achievement: Achievement, earnedAt: Date}[]> {
    const playerAchievementList = await db.select({
      playerAchievement: playerAchievements,
      achievement: achievements
    })
    .from(playerAchievements)
    .innerJoin(achievements, eq(playerAchievements.achievementId, achievements.id))
    .where(eq(playerAchievements.playerId, playerId));

    return playerAchievementList.map(item => ({
      achievement: item.achievement,
      earnedAt: item.playerAchievement.earnedAt
    }));
  }

  async addPlayerAchievement(playerId: number, achievementId: number): Promise<boolean> {
    try {
      await db.insert(playerAchievements)
        .values({
          playerId,
          achievementId,
          earnedAt: new Date()
        });
      return true;
    } catch (error) {
      console.error("Error adding player achievement:", error);
      return false;
    }
  }
}