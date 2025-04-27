import { 
  User, InsertUser, Team, InsertTeam, Booking, InsertBooking,
  PlayerBooking, InsertPlayerBooking, MatchStats, InsertMatchStats,
  PlayerStats, InsertPlayerStats, Achievement, PlayerAchievement,
  CreditTransaction, InsertCreditTransaction, Notification, InsertNotification,
  CalendarIntegration, InsertCalendarIntegration,
  users, teams, bookings, playerBookings, matchStats, playerStats,
  achievements, playerAchievements, creditTransactions, notifications,
  calendarIntegrations
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

  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams);
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
    
    // Check for achievements after creating player stats
    await this.checkPlayerAchievements(insertPlayerStats.playerId);
    
    return stats;
  }

  async updatePlayerStats(id: number, update: Partial<PlayerStats>): Promise<PlayerStats | undefined> {
    const [stats] = await db.update(playerStats)
      .set(update)
      .where(eq(playerStats.id, id))
      .returning();
      
    if (stats) {
      // Check for achievements after updating player stats
      await this.checkPlayerAchievements(stats.playerId);
    }
    
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

  async createAchievement(achievement: { title: string, description: string, icon: string, points: number }): Promise<Achievement> {
    try {
      const [newAchievement] = await db.insert(achievements)
        .values({
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          points: achievement.points
        })
        .returning();
      
      return newAchievement;
    } catch (error) {
      console.error("Error creating achievement:", error);
      throw new Error("Failed to create achievement");
    }
  }

  async addPlayerAchievement(playerId: number, achievementId: number): Promise<boolean> {
    try {
      // Check if player already has this achievement
      const existingAchievements = await db.select()
        .from(playerAchievements)
        .where(and(
          eq(playerAchievements.playerId, playerId),
          eq(playerAchievements.achievementId, achievementId)
        ));
        
      if (existingAchievements.length > 0) {
        return false; // Already has this achievement
      }
      
      // Add the achievement
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
  
  /**
   * Check and award achievements based on player stats and performance
   * This should be called after updating player stats
   */
  async checkPlayerAchievements(playerId: number): Promise<void> {
    try {
      // Get all player stats
      const playerStats = await this.getPlayerStatsByPlayer(playerId);
      if (!playerStats.length) return;
      
      // Calculate totals
      const totalGoals = playerStats.reduce((sum, stat) => sum + (stat.goals || 0), 0);
      const totalAssists = playerStats.reduce((sum, stat) => sum + (stat.assists || 0), 0);
      const totalYellowCards = playerStats.reduce((sum, stat) => sum + (stat.yellowCards || 0), 0);
      const totalRedCards = playerStats.reduce((sum, stat) => sum + (stat.redCards || 0), 0);
      const totalMatches = playerStats.length;
      
      // Get all achievements
      const allAchievements = await this.getAchievements();
      
      // First Goal achievement (ID 1)
      if (totalGoals > 0) {
        const firstGoalAchievement = allAchievements.find(a => a.title === "First Goal");
        if (firstGoalAchievement) {
          await this.addPlayerAchievement(playerId, firstGoalAchievement.id);
        }
      }
      
      // Goal Machine achievement (ID 2) - 10+ goals
      if (totalGoals >= 10) {
        const goalMachineAchievement = allAchievements.find(a => a.title === "Goal Machine");
        if (goalMachineAchievement) {
          await this.addPlayerAchievement(playerId, goalMachineAchievement.id);
        }
      }
      
      // Hat-trick Hero achievement (ID 3)
      const hasHatTrick = playerStats.some(stat => (stat.goals || 0) >= 3);
      if (hasHatTrick) {
        const hatTrickAchievement = allAchievements.find(a => a.title === "Hat-trick Hero");
        if (hatTrickAchievement) {
          await this.addPlayerAchievement(playerId, hatTrickAchievement.id);
        }
      }
      
      // Playmaker achievement (ID 4) - 5+ assists
      if (totalAssists >= 5) {
        const playmakerAchievement = allAchievements.find(a => a.title === "Playmaker");
        if (playmakerAchievement) {
          await this.addPlayerAchievement(playerId, playmakerAchievement.id);
        }
      }
      
      // Team Player achievement (ID 5) - 10+ matches
      if (totalMatches >= 10) {
        const teamPlayerAchievement = allAchievements.find(a => a.title === "Team Player");
        if (teamPlayerAchievement) {
          await this.addPlayerAchievement(playerId, teamPlayerAchievement.id);
        }
      }
      
      // Check for match-specific achievements (e.g., clean sheets)
      const bookingIds = playerStats.map(stat => stat.bookingId);
      for (const bookingId of bookingIds) {
        const matchStat = await this.getMatchStatsByBooking(bookingId);
        if (matchStat) {
          // Winner achievement (ID 6)
          if (matchStat.isWin) {
            const winnerAchievement = allAchievements.find(a => a.title === "Winner");
            if (winnerAchievement) {
              await this.addPlayerAchievement(playerId, winnerAchievement.id);
            }
          }
          
          // Clean Sheet achievement (ID 7) - for goalkeepers
          const playerStat = playerStats.find(stat => stat.bookingId === bookingId);
          if (playerStat && matchStat.opponentScore === 0) {
            // Add a check here if the player is a goalkeeper
            const cleanSheetAchievement = allAchievements.find(a => a.title === "Clean Sheet");
            if (cleanSheetAchievement) {
              await this.addPlayerAchievement(playerId, cleanSheetAchievement.id);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking player achievements:", error);
    }
  }

  // Notifications
  async getNotifications(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId));
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return await db.select()
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    try {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, id));
      return true;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    try {
      await db.update(notifications)
        .set({ isRead: true })
        .where(and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        ));
      return true;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  async deleteNotification(id: number): Promise<boolean> {
    try {
      const result = await db.delete(notifications)
        .where(eq(notifications.id, id));
      return !!result.rowCount;
    } catch (error) {
      console.error("Error deleting notification:", error);
      return false;
    }
  }

  // Get all bookings (used for notification service)
  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
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
  
  // Calendar Integration methods
  async getCalendarIntegration(id: number): Promise<CalendarIntegration | undefined> {
    const [integration] = await db.select()
      .from(calendarIntegrations)
      .where(eq(calendarIntegrations.id, id));
    return integration;
  }
  
  async getCalendarIntegrationByUser(userId: number, provider: string): Promise<CalendarIntegration | undefined> {
    const [integration] = await db.select()
      .from(calendarIntegrations)
      .where(and(
        eq(calendarIntegrations.userId, userId),
        eq(calendarIntegrations.provider, provider)
      ));
    return integration;
  }
  
  async createCalendarIntegration(integration: InsertCalendarIntegration): Promise<CalendarIntegration> {
    try {
      const [newIntegration] = await db.insert(calendarIntegrations)
        .values(integration)
        .returning();
      return newIntegration;
    } catch (error) {
      console.error("Error creating calendar integration:", error);
      throw new Error("Failed to create calendar integration");
    }
  }
  
  async updateCalendarIntegration(id: number, update: Partial<CalendarIntegration>): Promise<CalendarIntegration | undefined> {
    try {
      const [integration] = await db.update(calendarIntegrations)
        .set(update)
        .where(eq(calendarIntegrations.id, id))
        .returning();
      return integration;
    } catch (error) {
      console.error("Error updating calendar integration:", error);
      return undefined;
    }
  }
  
  async deleteCalendarIntegration(id: number): Promise<boolean> {
    try {
      const result = await db.delete(calendarIntegrations)
        .where(eq(calendarIntegrations.id, id));
      return !!result.rowCount;
    } catch (error) {
      console.error("Error deleting calendar integration:", error);
      return false;
    }
  }
}