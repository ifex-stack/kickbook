import { pgTable, text, serial, integer, boolean, timestamp, json, real, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User & Auth schemas
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("player"), // admin or player
  teamId: integer("team_id"),
  isActive: boolean("is_active").notNull().default(true),
  credits: integer("credits").default(0),
  referralCode: text("referral_code"),
  referredBy: integer("referred_by"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: integer("owner_id").notNull(), // Admin who created the team
  subscription: text("subscription").default("basic"), // basic, pro, enterprise
  allowPlayerRegistration: boolean("allow_player_registration").default(true),
  allowPlayerBookingManagement: boolean("allow_player_booking_management").default(false),
  invitationCode: text("invitation_code"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  format: text("format").notNull(), // 5-a-side, 7-a-side, 11-a-side
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  totalSlots: integer("total_slots").notNull(),
  availableSlots: integer("available_slots").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playerBookings = pgTable("player_bookings", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  status: text("status").notNull().default("confirmed"), // confirmed, pending, canceled
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matchStats = pgTable("match_stats", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull(),
  teamScore: integer("team_score").default(0),
  opponentScore: integer("opponent_score").default(0),
  isWin: boolean("is_win").default(false),
  isDraw: boolean("is_draw").default(false),
  isLoss: boolean("is_loss").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playerStats = pgTable("player_stats", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  bookingId: integer("booking_id").notNull(),
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
  yellowCards: integer("yellow_cards").default(0),
  redCards: integer("red_cards").default(0),
  minutesPlayed: integer("minutes_played").default(0),
  isInjured: boolean("is_injured").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const playerAchievements = pgTable("player_achievements", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").notNull(),
  achievementId: integer("achievement_id").notNull(),
  earnedAt: timestamp("earned_at").defaultNow().notNull(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: integer("amount").notNull(), // Can be positive (purchase) or negative (usage)
  type: text("type").notNull(), // "purchase", "booking", "referral_bonus", "admin_adjustment"
  bookingId: integer("booking_id"), // Optional, only for booking transactions
  description: text("description"),
  teamOwnerId: integer("team_owner_id"), // To track which team owner gets paid
  status: text("status").notNull().default("completed"), // "pending", "completed", "failed", "refunded"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  stripeCustomerId: true,
  stripeSubscriptionId: true
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true
});

export const insertPlayerBookingSchema = createInsertSchema(playerBookings).omit({
  id: true,
  createdAt: true
});

export const insertMatchStatsSchema = createInsertSchema(matchStats).omit({
  id: true,
  createdAt: true
});

export const insertPlayerStatsSchema = createInsertSchema(playerStats).omit({
  id: true,
  createdAt: true
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type PlayerBooking = typeof playerBookings.$inferSelect;
export type InsertPlayerBooking = z.infer<typeof insertPlayerBookingSchema>;

export type MatchStats = typeof matchStats.$inferSelect;
export type InsertMatchStats = z.infer<typeof insertMatchStatsSchema>;

export type PlayerStats = typeof playerStats.$inferSelect;
export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;

export type Achievement = typeof achievements.$inferSelect;
export type PlayerAchievement = typeof playerAchievements.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
