import { 
  User, InsertUser, Team, InsertTeam, Booking, InsertBooking,
  PlayerBooking, InsertPlayerBooking, MatchStats, InsertMatchStats,
  PlayerStats, InsertPlayerStats, Achievement, PlayerAchievement,
  CreditTransaction, InsertCreditTransaction,
  users, teams, bookings, playerBookings, matchStats, playerStats,
  achievements, playerAchievements, creditTransactions
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

  // Credits and Transactions
  async getUserCredits(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;
    return user.credits || 0;
  }

  async addUserCredits(userId: number, amount: number, type: string, description?: string, teamOwnerId?: number): Promise<User> {
    // Begin transaction
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const currentCredits = user.credits || 0;
    const updatedUser = await this.updateUser(userId, { credits: currentCredits + amount });
    
    if (!updatedUser) {
      throw new Error(`Failed to update user ${userId} with credits`);
    }

    // Create a transaction record
    await this.createCreditTransaction({
      userId,
      amount,
      type,
      description: description || `Credit adjustment: ${type}`,
      teamOwnerId,
      status: "completed"
    });

    return updatedUser;
  }

  async useUserCredits(userId: number, amount: number, bookingId: number, description?: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const currentCredits = user.credits || 0;
    if (currentCredits < amount) {
      return false; // Not enough credits
    }

    // Deduct credits (negative amount)
    await this.updateUser(userId, { credits: currentCredits - amount });

    // Create a transaction record with negative amount to indicate usage
    await this.createCreditTransaction({
      userId,
      amount: -amount,
      type: "booking",
      bookingId,
      description: description || `Booking payment: ID ${bookingId}`,
      status: "completed"
    });

    // Find the team owner to credit them
    const booking = await this.getBooking(bookingId);
    if (booking) {
      const team = await this.getTeam(booking.teamId);
      if (team) {
        // Create a transaction record for the team owner (crediting them)
        await this.createCreditTransaction({
          userId: team.ownerId,
          amount: amount, // Positive amount for the team owner
          type: "booking_payment",
          bookingId,
          description: `Payment for booking ID ${bookingId}`,
          teamOwnerId: team.ownerId,
          status: "completed"
        });

        // Add credits to the team owner
        const teamOwner = await this.getUser(team.ownerId);
        if (teamOwner) {
          const ownerCredits = teamOwner.credits || 0;
          await this.updateUser(team.ownerId, { credits: ownerCredits + amount });
        }
      }
    }

    return true;
  }

  async getTransactionsByUser(userId: number): Promise<CreditTransaction[]> {
    return await db.select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(creditTransactions.createdAt);
  }

  async getTransactionsByTeamOwner(teamOwnerId: number): Promise<CreditTransaction[]> {
    return await db.select()
      .from(creditTransactions)
      .where(eq(creditTransactions.teamOwnerId, teamOwnerId))
      .orderBy(creditTransactions.createdAt);
  }

  async createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const [creditTransaction] = await db.insert(creditTransactions).values(transaction).returning();
    return creditTransaction;
  }

  async updateTransactionStatus(id: number, status: string): Promise<CreditTransaction | undefined> {
    const [transaction] = await db.update(creditTransactions)
      .set({ status })
      .where(eq(creditTransactions.id, id))
      .returning();
    return transaction;
  }
}