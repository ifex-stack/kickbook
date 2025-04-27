import { 
  users, teams, bookings, playerBookings, matchStats, playerStats, achievements, playerAchievements, creditTransactions, notifications, calendarIntegrations,
  type User, type InsertUser, type Team, type InsertTeam, type Booking, type InsertBooking,
  type PlayerBooking, type InsertPlayerBooking, type MatchStats, type InsertMatchStats,
  type PlayerStats, type InsertPlayerStats, type Achievement, type PlayerAchievement,
  type CreditTransaction, type InsertCreditTransaction, type Notification, type InsertNotification,
  type CalendarIntegration, type InsertCalendarIntegration
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Teams
  getTeam(id: number): Promise<Team | undefined>;
  getTeams(): Promise<Team[]>;
  getTeamsByOwner(ownerId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<Team>): Promise<Team | undefined>;
  
  // Bookings
  getBooking(id: number): Promise<Booking | undefined>;
  getBookingsByTeam(teamId: number): Promise<Booking[]>;
  getAllBookings(): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<Booking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
  
  // Player Bookings
  getPlayerBooking(id: number): Promise<PlayerBooking | undefined>;
  getPlayerBookingsByBooking(bookingId: number): Promise<PlayerBooking[]>;
  getPlayerBookingsByPlayer(playerId: number): Promise<PlayerBooking[]>;
  createPlayerBooking(playerBooking: InsertPlayerBooking): Promise<PlayerBooking>;
  updatePlayerBooking(id: number, playerBooking: Partial<PlayerBooking>): Promise<PlayerBooking | undefined>;
  deletePlayerBooking(id: number): Promise<boolean>;
  
  // Match Stats
  getMatchStats(id: number): Promise<MatchStats | undefined>;
  getMatchStatsByBooking(bookingId: number): Promise<MatchStats | undefined>;
  createMatchStats(matchStats: InsertMatchStats): Promise<MatchStats>;
  updateMatchStats(id: number, matchStats: Partial<MatchStats>): Promise<MatchStats | undefined>;
  
  // Player Stats
  getPlayerStats(id: number): Promise<PlayerStats | undefined>;
  getPlayerStatsByPlayer(playerId: number): Promise<PlayerStats[]>;
  getPlayerStatsByBooking(bookingId: number): Promise<PlayerStats[]>;
  createPlayerStats(playerStats: InsertPlayerStats): Promise<PlayerStats>;
  updatePlayerStats(id: number, playerStats: Partial<PlayerStats>): Promise<PlayerStats | undefined>;
  
  // Stripe
  updateUserStripeInfo(userId: number, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined>;
  
  // Team Members
  getTeamMembers(teamId: number): Promise<User[]>;
  
  // Achievements
  getAchievements(): Promise<Achievement[]>;
  getPlayerAchievements(playerId: number): Promise<{achievement: Achievement, earnedAt: Date}[]>;
  addPlayerAchievement(playerId: number, achievementId: number): Promise<boolean>;
  createAchievement(achievement: {title: string, description: string, icon: string, points: number}): Promise<Achievement>;
  
  // Notifications
  getNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Credits and Transactions
  getUserCredits(userId: number): Promise<number>;
  addUserCredits(userId: number, amount: number, type: string, description?: string, teamOwnerId?: number): Promise<User>;
  useUserCredits(userId: number, amount: number, bookingId: number, description?: string): Promise<boolean>;
  getTransactionsByUser(userId: number): Promise<CreditTransaction[]>;
  getTransactionsByTeamOwner(teamOwnerId: number): Promise<CreditTransaction[]>;
  createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction>;
  updateTransactionStatus(id: number, status: string): Promise<CreditTransaction | undefined>;
  
  // Calendar Integrations
  getCalendarIntegration(id: number): Promise<CalendarIntegration | undefined>;
  getCalendarIntegrationByUser(userId: number, provider: string): Promise<CalendarIntegration | undefined>;
  createCalendarIntegration(integration: InsertCalendarIntegration): Promise<CalendarIntegration>;
  updateCalendarIntegration(id: number, update: Partial<CalendarIntegration>): Promise<CalendarIntegration | undefined>;
  deleteCalendarIntegration(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private teams: Map<number, Team>;
  private bookings: Map<number, Booking>;
  private playerBookings: Map<number, PlayerBooking>;
  private matchStats: Map<number, MatchStats>;
  private playerStats: Map<number, PlayerStats>;
  private achievements: Map<number, Achievement>;
  private playerAchievements: Map<number, PlayerAchievement>;
  private creditTransactions: Map<number, CreditTransaction>;
  private notifications: Map<number, Notification>;
  private calendarIntegrations: Map<number, CalendarIntegration>;
  
  private userIdCounter: number;
  private teamIdCounter: number;
  private bookingIdCounter: number;
  private playerBookingIdCounter: number;
  private matchStatsIdCounter: number;
  private playerStatsIdCounter: number;
  private achievementIdCounter: number;
  private playerAchievementIdCounter: number;
  private creditTransactionIdCounter: number;
  private notificationIdCounter: number;
  private calendarIntegrationIdCounter: number;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.bookings = new Map();
    this.playerBookings = new Map();
    this.matchStats = new Map();
    this.playerStats = new Map();
    this.achievements = new Map();
    this.playerAchievements = new Map();
    this.creditTransactions = new Map();
    this.notifications = new Map();
    this.calendarIntegrations = new Map();
    
    this.userIdCounter = 1;
    this.teamIdCounter = 1;
    this.bookingIdCounter = 1;
    this.playerBookingIdCounter = 1;
    this.matchStatsIdCounter = 1;
    this.playerStatsIdCounter = 1;
    this.achievementIdCounter = 1;
    this.playerAchievementIdCounter = 1;
    this.creditTransactionIdCounter = 1;
    this.notificationIdCounter = 1;
    this.calendarIntegrationIdCounter = 1;
    
    // Add some default achievements
    this.seedAchievements();
  }

  private seedAchievements() {
    const defaultAchievements = [
      { title: "First Goal", description: "Score your first goal", icon: "sports_score", points: 10 },
      { title: "Hat-trick Hero", description: "Score three goals in one match", icon: "stars", points: 30 },
      { title: "Playmaker", description: "Make 5 assists in a season", icon: "handshake", points: 20 },
      { title: "Clean Sheet", description: "Complete a match without conceding a goal", icon: "shield", points: 15 },
      { title: "Team Player", description: "Participate in 10 matches", icon: "groups", points: 25 }
    ];
    
    defaultAchievements.forEach(achievement => {
      const id = this.achievementIdCounter++;
      this.achievements.set(id, {
        id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        points: achievement.points,
        createdAt: new Date()
      });
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, update: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...update };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Teams
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeamsByOwner(ownerId: number): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(team => team.ownerId === ownerId);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.teamIdCounter++;
    const team: Team = { ...insertTeam, id, createdAt: new Date() };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: number, update: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    const updatedTeam = { ...team, ...update };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  // Bookings
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByTeam(teamId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.teamId === teamId);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.bookingIdCounter++;
    const booking: Booking = { ...insertBooking, id, createdAt: new Date() };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: number, update: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...update };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async deleteBooking(id: number): Promise<boolean> {
    return this.bookings.delete(id);
  }

  // Player Bookings
  async getPlayerBooking(id: number): Promise<PlayerBooking | undefined> {
    return this.playerBookings.get(id);
  }

  async getPlayerBookingsByBooking(bookingId: number): Promise<PlayerBooking[]> {
    return Array.from(this.playerBookings.values()).filter(pb => pb.bookingId === bookingId);
  }

  async getPlayerBookingsByPlayer(playerId: number): Promise<PlayerBooking[]> {
    return Array.from(this.playerBookings.values()).filter(pb => pb.playerId === playerId);
  }

  async createPlayerBooking(insertPlayerBooking: InsertPlayerBooking): Promise<PlayerBooking> {
    const id = this.playerBookingIdCounter++;
    const playerBooking: PlayerBooking = { ...insertPlayerBooking, id, createdAt: new Date() };
    this.playerBookings.set(id, playerBooking);
    
    // Update available slots
    const booking = await this.getBooking(insertPlayerBooking.bookingId);
    if (booking && booking.availableSlots > 0) {
      await this.updateBooking(booking.id, { 
        availableSlots: booking.availableSlots - 1 
      });
    }
    
    return playerBooking;
  }

  async updatePlayerBooking(id: number, update: Partial<PlayerBooking>): Promise<PlayerBooking | undefined> {
    const playerBooking = this.playerBookings.get(id);
    if (!playerBooking) return undefined;
    
    const updatedPlayerBooking = { ...playerBooking, ...update };
    this.playerBookings.set(id, updatedPlayerBooking);
    return updatedPlayerBooking;
  }

  async deletePlayerBooking(id: number): Promise<boolean> {
    const playerBooking = this.playerBookings.get(id);
    if (!playerBooking) return false;
    
    // Restore available slot
    const booking = await this.getBooking(playerBooking.bookingId);
    if (booking) {
      await this.updateBooking(booking.id, { 
        availableSlots: booking.availableSlots + 1 
      });
    }
    
    return this.playerBookings.delete(id);
  }

  // Match Stats
  async getMatchStats(id: number): Promise<MatchStats | undefined> {
    return this.matchStats.get(id);
  }

  async getMatchStatsByBooking(bookingId: number): Promise<MatchStats | undefined> {
    return Array.from(this.matchStats.values()).find(stats => stats.bookingId === bookingId);
  }

  async createMatchStats(insertMatchStats: InsertMatchStats): Promise<MatchStats> {
    const id = this.matchStatsIdCounter++;
    const stats: MatchStats = { ...insertMatchStats, id, createdAt: new Date() };
    this.matchStats.set(id, stats);
    return stats;
  }

  async updateMatchStats(id: number, update: Partial<MatchStats>): Promise<MatchStats | undefined> {
    const stats = this.matchStats.get(id);
    if (!stats) return undefined;
    
    const updatedStats = { ...stats, ...update };
    this.matchStats.set(id, updatedStats);
    return updatedStats;
  }

  // Player Stats
  async getPlayerStats(id: number): Promise<PlayerStats | undefined> {
    return this.playerStats.get(id);
  }

  async getPlayerStatsByPlayer(playerId: number): Promise<PlayerStats[]> {
    return Array.from(this.playerStats.values()).filter(stats => stats.playerId === playerId);
  }

  async getPlayerStatsByBooking(bookingId: number): Promise<PlayerStats[]> {
    return Array.from(this.playerStats.values()).filter(stats => stats.bookingId === bookingId);
  }

  async createPlayerStats(insertPlayerStats: InsertPlayerStats): Promise<PlayerStats> {
    const id = this.playerStatsIdCounter++;
    const stats: PlayerStats = { ...insertPlayerStats, id, createdAt: new Date() };
    this.playerStats.set(id, stats);
    
    // Check for achievements based on these stats
    this.checkPlayerAchievements(insertPlayerStats.playerId);
    
    return stats;
  }

  async updatePlayerStats(id: number, update: Partial<PlayerStats>): Promise<PlayerStats | undefined> {
    const stats = this.playerStats.get(id);
    if (!stats) return undefined;
    
    const updatedStats = { ...stats, ...update };
    this.playerStats.set(id, updatedStats);
    
    // Check for achievements after update
    this.checkPlayerAchievements(stats.playerId);
    
    return updatedStats;
  }
  
  // Stripe
  async updateUserStripeInfo(userId: number, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeCustomerId, stripeSubscriptionId });
  }
  
  // Team Members
  async getTeamMembers(teamId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.teamId === teamId);
  }
  
  // Achievements
  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }
  
  async getPlayerAchievements(playerId: number): Promise<{achievement: Achievement, earnedAt: Date}[]> {
    const playerAchs = Array.from(this.playerAchievements.values())
      .filter(pa => pa.playerId === playerId);
      
    return playerAchs.map(pa => {
      const achievement = this.achievements.get(pa.achievementId);
      if (!achievement) throw new Error("Achievement not found");
      return {
        achievement,
        earnedAt: pa.earnedAt
      };
    });
  }
  
  async createAchievement(achievement: { title: string, description: string, icon: string, points: number }): Promise<Achievement> {
    const id = this.achievementIdCounter++;
    const newAchievement: Achievement = {
      id,
      ...achievement,
      createdAt: new Date()
    };
    
    this.achievements.set(id, newAchievement);
    return newAchievement;
  }

  async addPlayerAchievement(playerId: number, achievementId: number): Promise<boolean> {
    // Check if player already has this achievement
    const existing = Array.from(this.playerAchievements.values())
      .find(pa => pa.playerId === playerId && pa.achievementId === achievementId);
      
    if (existing) return false;
    
    const id = this.playerAchievementIdCounter++;
    this.playerAchievements.set(id, {
      id,
      playerId,
      achievementId,
      earnedAt: new Date()
    });
    
    return true;
  }
  
  private async checkPlayerAchievements(playerId: number) {
    const playerStats = await this.getPlayerStatsByPlayer(playerId);
    
    // First Goal achievement
    const totalGoals = playerStats.reduce((sum, stat) => sum + (stat.goals || 0), 0);
    if (totalGoals > 0) {
      await this.addPlayerAchievement(playerId, 1);
    }
    
    // Hat-trick Hero achievement
    const hasHatTrick = playerStats.some(stat => (stat.goals || 0) >= 3);
    if (hasHatTrick) {
      await this.addPlayerAchievement(playerId, 2);
    }
    
    // Playmaker achievement
    const totalAssists = playerStats.reduce((sum, stat) => sum + (stat.assists || 0), 0);
    if (totalAssists >= 5) {
      await this.addPlayerAchievement(playerId, 3);
    }
    
    // Team Player achievement
    if (playerStats.length >= 10) {
      await this.addPlayerAchievement(playerId, 5);
    }
    
    // Clean Sheet achievement - need to check if player's team didn't concede any goals
    const matchIds = playerStats.map(stat => stat.bookingId);
    for (const matchId of matchIds) {
      const matchStat = await this.getMatchStatsByBooking(matchId);
      if (matchStat && matchStat.opponentScore === 0) {
        await this.addPlayerAchievement(playerId, 4);
        break;
      }
    }
  }

  // Notifications
  async getNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUnreadNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date()
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    notification.isRead = true;
    this.notifications.set(id, notification);
    return true;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead);
    
    for (const notification of userNotifications) {
      notification.isRead = true;
      this.notifications.set(notification.id, notification);
    }
    
    return true;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }

  // Get all bookings (for notification service)
  async getAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  // Credits and Transactions
  async getUserCredits(userId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;
    return user.credits || 0;
  }

  async addUserCredits(userId: number, amount: number, type: string, description?: string, teamOwnerId?: number): Promise<User> {
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
    return Array.from(this.creditTransactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getTransactionsByTeamOwner(teamOwnerId: number): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .filter(tx => tx.teamOwnerId === teamOwnerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createCreditTransaction(transaction: InsertCreditTransaction): Promise<CreditTransaction> {
    const id = this.creditTransactionIdCounter++;
    const creditTransaction: CreditTransaction = { ...transaction, id, createdAt: new Date() };
    this.creditTransactions.set(id, creditTransaction);
    return creditTransaction;
  }

  async updateTransactionStatus(id: number, status: string): Promise<CreditTransaction | undefined> {
    const transaction = this.creditTransactions.get(id);
    if (!transaction) return undefined;
    
    const updatedTransaction = { ...transaction, status };
    this.creditTransactions.set(id, updatedTransaction);
    return updatedTransaction;
  }
  
  // Calendar Integration methods
  async getCalendarIntegration(id: number): Promise<CalendarIntegration | undefined> {
    return this.calendarIntegrations.get(id);
  }
  
  async getCalendarIntegrationByUser(userId: number, provider: string): Promise<CalendarIntegration | undefined> {
    return Array.from(this.calendarIntegrations.values())
      .find(integration => integration.userId === userId && integration.provider === provider);
  }
  
  async createCalendarIntegration(integration: InsertCalendarIntegration): Promise<CalendarIntegration> {
    const id = this.calendarIntegrationIdCounter++;
    const newIntegration: CalendarIntegration = { 
      ...integration, 
      id, 
      createdAt: new Date() 
    };
    this.calendarIntegrations.set(id, newIntegration);
    return newIntegration;
  }
  
  async updateCalendarIntegration(id: number, update: Partial<CalendarIntegration>): Promise<CalendarIntegration | undefined> {
    const integration = this.calendarIntegrations.get(id);
    if (!integration) return undefined;
    
    const updatedIntegration = { ...integration, ...update };
    this.calendarIntegrations.set(id, updatedIntegration);
    return updatedIntegration;
  }
  
  async deleteCalendarIntegration(id: number): Promise<boolean> {
    return this.calendarIntegrations.delete(id);
  }
}

// Import DatabaseStorage
import { DatabaseStorage } from "./database-storage";

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
