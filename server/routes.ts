import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { z } from "zod";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import { 
  insertUserSchema, 
  insertTeamSchema, 
  insertBookingSchema,
  insertPlayerBookingSchema, 
  insertMatchStatsSchema,
  insertPlayerStatsSchema,
  insertNotificationSchema,
  teams as teamSchema
} from "@shared/schema";
import { processCancellation, cancelEntireBooking } from "./services/cancellation-service";
import { getWeatherForBooking } from "./services/weather-service";
import { sendNotification, NotificationType } from "./services/notification-service";
import { eq } from "drizzle-orm";
import { db } from "./db";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: "2023-10-16", // Use a supported API version
});

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session store
  const MemoryStoreInstance = MemoryStore(session);
  
  app.use(session({
    secret: process.env.SESSION_SECRET || "kickbook-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    store: new MemoryStoreInstance({
      checkPeriod: 86400000 // 24 hours
    })
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure Passport
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      
      if (user.password !== password) { // In production, use proper password hashing
        return done(null, false, { message: "Incorrect password" });
      }
      
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const parseResult = insertUserSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: parseResult.error.errors 
        });
      }
      
      const userData = parseResult.data;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(userData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Create user
      const newUser = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    // If this function is called, authentication was successful
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Middleware to check if user is authenticated
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  // Middleware to check if user is admin
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as any;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    next();
  };

  // Team routes
  app.get("/api/teams", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const teams = await storage.getTeamsByOwner(user.id);
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/teams/:id", requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user is associated with the team or is the team owner
      if (user.teamId !== teamId && team.ownerId !== user.id) {
        return res.status(403).json({ message: "Not authorized to view this team" });
      }
      
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.patch("/api/teams/:id/settings", requireAdmin, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user is the admin of the team
      if (user.role !== "admin" || team.ownerId !== user.id) {
        return res.status(403).json({ message: "Not authorized to update team settings" });
      }
      
      // Update team settings
      const updatedTeam = await storage.updateTeam(teamId, {
        ...req.body,
      });
      
      res.json(updatedTeam);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/teams", requireAuth, async (req, res) => {
    try {
      const parseResult = insertTeamSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid team data", 
          errors: parseResult.error.errors 
        });
      }
      
      const teamData = parseResult.data;
      const user = req.user as any;
      
      // Override ownerId with current user id
      teamData.ownerId = user.id;
      
      const newTeam = await storage.createTeam(teamData);
      
      // Update user with team id if not already set
      if (!user.teamId) {
        await storage.updateUser(user.id, { teamId: newTeam.id });
      }
      
      res.status(201).json(newTeam);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });



  app.put("/api/teams/:id", requireAdmin, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user is the owner of the team
      if (team.ownerId !== user.id) {
        return res.status(403).json({ message: "Not authorized to update this team" });
      }
      
      const updatedTeam = await storage.updateTeam(teamId, req.body);
      res.json(updatedTeam);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Team members routes
  app.get("/api/teams/:id/members", requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const members = await storage.getTeamMembers(teamId);
      
      // Remove passwords from response
      const membersWithoutPasswords = members.map(member => {
        const { password, ...memberWithoutPassword } = member;
        return memberWithoutPassword;
      });
      
      res.json(membersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/teams/:id/members", requireAdmin, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user is the owner of the team
      if (team.ownerId !== user.id) {
        return res.status(403).json({ message: "Not authorized to add members to this team" });
      }
      
      const { email, name, role = "player" } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ message: "Email and name are required" });
      }
      
      // Check if user already exists
      let existingUser = await storage.getUserByEmail(email);
      
      if (existingUser) {
        // Update user with team id if not already in a team
        if (!existingUser.teamId) {
          existingUser = await storage.updateUser(existingUser.id, { teamId }) as any;
        } else if (existingUser.teamId !== teamId) {
          return res.status(400).json({ 
            message: "User already belongs to a different team" 
          });
        }
        
        if (existingUser) {
          const { password, ...userWithoutPassword } = existingUser;
          return res.json(userWithoutPassword);
        }
        return res.status(500).json({ message: "Error updating user" });
      }
      
      // Create new user
      const username = email.split('@')[0] + Date.now();
      const password = Math.random().toString(36).substring(2, 10);
      
      const newUser = await storage.createUser({
        username,
        password,
        email,
        name,
        role,
        teamId
      });
      
      // Remove password from response
      const { password: pwd, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Booking routes
  app.get("/api/bookings", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user.teamId) {
        return res.status(400).json({ message: "User not associated with a team" });
      }
      
      const bookings = await storage.getBookingsByTeam(user.teamId);
      res.json(bookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bookings", requireAdmin, async (req, res) => {
    try {
      const parseResult = insertBookingSchema.safeParse(req.body);
      
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid booking data", 
          errors: parseResult.error.errors 
        });
      }
      
      const bookingData = parseResult.data;
      const user = req.user as any;
      
      if (!user.teamId) {
        return res.status(400).json({ message: "User not associated with a team" });
      }
      
      // Set team id from user
      bookingData.teamId = user.teamId;
      
      const newBooking = await storage.createBooking(bookingData);
      res.status(201).json(newBooking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/bookings/:id", requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the team with this booking
      if (user.teamId !== booking.teamId) {
        return res.status(403).json({ message: "Not authorized to view this booking" });
      }
      
      res.json(booking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/bookings/:id", requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the team with this booking
      if (user.teamId !== booking.teamId) {
        return res.status(403).json({ message: "Not authorized to update this booking" });
      }
      
      const updatedBooking = await storage.updateBooking(bookingId, req.body);
      res.json(updatedBooking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/bookings/:id", requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the team with this booking
      if (user.teamId !== booking.teamId) {
        return res.status(403).json({ message: "Not authorized to delete this booking" });
      }
      
      await storage.deleteBooking(bookingId);
      res.json({ message: "Booking deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Player booking routes
  app.get("/api/bookings/:id/players", requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the team with this booking
      if (user.teamId !== booking.teamId) {
        return res.status(403).json({ message: "Not authorized to view this booking" });
      }
      
      const playerBookings = await storage.getPlayerBookingsByBooking(bookingId);
      res.json(playerBookings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bookings/:id/players", requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the team with this booking
      if (user.teamId !== booking.teamId) {
        return res.status(403).json({ message: "Not authorized to join this booking" });
      }
      
      // Check if booking has available slots
      if (booking.availableSlots <= 0) {
        return res.status(400).json({ message: "No available slots for this booking" });
      }
      
      // Check if player already joined
      const existingBooking = await storage.getPlayerBookingsByPlayer(user.id);
      const alreadyJoined = existingBooking.some(pb => pb.bookingId === bookingId);
      
      if (alreadyJoined) {
        return res.status(400).json({ message: "Player already joined this booking" });
      }
      
      const playerBookingData = {
        playerId: user.id,
        bookingId,
        status: "confirmed"
      };
      
      const newPlayerBooking = await storage.createPlayerBooking(playerBookingData);
      res.status(201).json(newPlayerBooking);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/bookings/:bookingId/players/:playerId", requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.bookingId);
      const playerId = parseInt(req.params.playerId);
      
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user is either the player or an admin
      if (user.id !== playerId && user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to remove this player" });
      }
      
      // Find the player booking
      const playerBookings = await storage.getPlayerBookingsByBooking(bookingId);
      const playerBooking = playerBookings.find(pb => pb.playerId === playerId);
      
      if (!playerBooking) {
        return res.status(404).json({ message: "Player booking not found" });
      }
      
      await storage.deletePlayerBooking(playerBooking.id);
      res.json({ message: "Player removed from booking successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Match stats routes
  app.get("/api/bookings/:id/stats", requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the team with this booking
      if (user.teamId !== booking.teamId) {
        return res.status(403).json({ message: "Not authorized to view stats for this booking" });
      }
      
      const matchStats = await storage.getMatchStatsByBooking(bookingId);
      res.json(matchStats || { bookingId });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bookings/:id/stats", requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the team with this booking
      if (user.teamId !== booking.teamId) {
        return res.status(403).json({ message: "Not authorized to add stats for this booking" });
      }
      
      // Check if stats already exist
      const existingStats = await storage.getMatchStatsByBooking(bookingId);
      
      if (existingStats) {
        return res.status(400).json({ message: "Stats already exist for this booking" });
      }
      
      const statsData = {
        bookingId,
        ...req.body,
        isWin: req.body.teamScore > req.body.opponentScore,
        isDraw: req.body.teamScore === req.body.opponentScore,
        isLoss: req.body.teamScore < req.body.opponentScore
      };
      
      const newStats = await storage.createMatchStats(statsData);
      res.status(201).json(newStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/bookings/:id/stats", requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the team with this booking
      if (user.teamId !== booking.teamId) {
        return res.status(403).json({ message: "Not authorized to update stats for this booking" });
      }
      
      // Check if stats exist
      const existingStats = await storage.getMatchStatsByBooking(bookingId);
      
      if (!existingStats) {
        return res.status(404).json({ message: "Stats not found for this booking" });
      }
      
      const updatedStatsData = {
        ...req.body
      };
      
      // Only update win/draw/loss if scores are provided
      if (req.body.teamScore !== undefined && req.body.opponentScore !== undefined) {
        updatedStatsData.isWin = req.body.teamScore > req.body.opponentScore;
        updatedStatsData.isDraw = req.body.teamScore === req.body.opponentScore;
        updatedStatsData.isLoss = req.body.teamScore < req.body.opponentScore;
      }
      
      const updatedStats = await storage.updateMatchStats(existingStats.id, updatedStatsData);
      res.json(updatedStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Player stats routes
  app.get("/api/bookings/:id/players/:playerId/stats", requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const playerId = parseInt(req.params.playerId);
      
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the team with this booking
      if (user.teamId !== booking.teamId) {
        return res.status(403).json({ message: "Not authorized to view stats for this booking" });
      }
      
      // Get player stats for this booking
      const playerStats = await storage.getPlayerStatsByBooking(bookingId);
      const stats = playerStats.find(ps => ps.playerId === playerId);
      
      res.json(stats || { playerId, bookingId });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/bookings/:id/players/:playerId/stats", requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const playerId = parseInt(req.params.playerId);
      
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the team with this booking
      if (user.teamId !== booking.teamId) {
        return res.status(403).json({ message: "Not authorized to add stats for this booking" });
      }
      
      // Check if player belongs to the team
      const player = await storage.getUser(playerId);
      
      if (!player || player.teamId !== user.teamId) {
        return res.status(404).json({ message: "Player not found in team" });
      }
      
      // Check if stats already exist
      const playerStats = await storage.getPlayerStatsByBooking(bookingId);
      const existingStats = playerStats.find(ps => ps.playerId === playerId);
      
      if (existingStats) {
        return res.status(400).json({ message: "Stats already exist for this player and booking" });
      }
      
      const statsData = {
        playerId,
        bookingId,
        ...req.body
      };
      
      const newStats = await storage.createPlayerStats(statsData);
      res.status(201).json(newStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/bookings/:id/players/:playerId/stats", requireAdmin, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const playerId = parseInt(req.params.playerId);
      
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the team with this booking
      if (user.teamId !== booking.teamId) {
        return res.status(403).json({ message: "Not authorized to update stats for this booking" });
      }
      
      // Get player stats for this booking
      const playerStats = await storage.getPlayerStatsByBooking(bookingId);
      const existingStats = playerStats.find(ps => ps.playerId === playerId);
      
      if (!existingStats) {
        return res.status(404).json({ message: "Stats not found for this player and booking" });
      }
      
      const updatedStats = await storage.updatePlayerStats(existingStats.id, req.body);
      
      // Check for achievements after updating stats
      await storage.checkPlayerAchievements(playerId);
      
      res.json(updatedStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Player achievements routes
  app.get("/api/achievements", requireAuth, async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/players/:id/achievements", requireAuth, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const player = await storage.getUser(playerId);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the same team as the player
      if (user.teamId !== player.teamId) {
        return res.status(403).json({ message: "Not authorized to view achievements for this player" });
      }
      
      const achievements = await storage.getPlayerAchievements(playerId);
      res.json(achievements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Get player stats summary
  app.get("/api/players/:id/stats", requireAuth, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const player = await storage.getUser(playerId);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user belongs to the same team as the player
      if (user.teamId !== player.teamId && user.id !== playerId) {
        return res.status(403).json({ message: "Not authorized to view stats for this player" });
      }
      
      const playerStats = await storage.getPlayerStatsByPlayer(playerId);
      
      // Calculate summary stats
      const summary = {
        totalGoals: playerStats.reduce((sum, stat) => sum + stat.goals, 0),
        totalAssists: playerStats.reduce((sum, stat) => sum + stat.assists, 0),
        totalYellowCards: playerStats.reduce((sum, stat) => sum + stat.yellowCards, 0),
        totalRedCards: playerStats.reduce((sum, stat) => sum + stat.redCards, 0),
        totalMatches: playerStats.length,
        matchesWithGoals: playerStats.filter(stat => stat.goals > 0).length,
        matchesWithAssists: playerStats.filter(stat => stat.assists > 0).length,
        matchesWithCards: playerStats.filter(stat => stat.yellowCards > 0 || stat.redCards > 0).length,
      };
      
      res.json({
        player: { 
          id: player.id,
          name: player.name,
          email: player.email,
          role: player.role
        },
        summary,
        stats: playerStats
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Demo data for testing
  if (process.env.NODE_ENV === "development") {
    app.post("/api/demo-data", async (req, res) => {
      try {
        // Check if demo data already exists
        let admin = await storage.getUserByUsername("admin");
        
        if (!admin) {
          // Create admin user
          admin = await storage.createUser({
            username: "admin",
            password: "password",
            email: "admin@example.com",
            name: "John Coach",
            role: "admin"
          });
        }
        
        // Check if team exists
        const teams = await storage.getTeamsByOwner(admin.id);
        let team = teams.length > 0 ? teams[0] : null;
        
        if (!team) {
          // Create team
          team = await storage.createTeam({
            name: "Football Stars",
            ownerId: admin.id,
            subscription: "basic"
          });
        }
        
        // Update admin with team id
        await storage.updateUser(admin.id, { teamId: team.id });
        
        // Create or get players
        const playerDetails = [
          {
            username: "player1",
            password: "password",
            email: "player1@example.com",
            name: "Alex Johnson",
            role: "player",
            teamId: team.id
          },
          {
            username: "player2",
            password: "password",
            email: "player2@example.com",
            name: "Sara Wilson",
            role: "player",
            teamId: team.id
          },
          {
            username: "player3",
            password: "password",
            email: "player3@example.com",
            name: "Mike Chen",
            role: "player",
            teamId: team.id
          }
        ];
        
        const createdPlayers = [];
        for (const playerDetail of playerDetails) {
          // Check if player exists
          let player = await storage.getUserByUsername(playerDetail.username);
          
          if (!player) {
            player = await storage.createUser(playerDetail);
          } else {
            // Update team ID if needed
            if (player.teamId !== team.id) {
              player = await storage.updateUser(player.id, { teamId: team.id });
            }
          }
          
          createdPlayers.push(player);
        }
        
        // Create achievements if needed
        const existingAchievements = await storage.getAchievements();
        if (existingAchievements.length === 0) {
          const achievementsList = [
            { title: "First Goal", description: "Score your first goal", icon: "sports_score", points: 10 },
            { title: "Goal Machine", description: "Score 10 goals in total", icon: "whatshot", points: 30 },
            { title: "Hat-trick Hero", description: "Score three goals in one match", icon: "stars", points: 30 },
            { title: "Playmaker", description: "Make 5 assists in a season", icon: "handshake", points: 20 },
            { title: "Team Player", description: "Participate in 10 matches", icon: "groups", points: 25 },
            { title: "Winner", description: "Win your first match", icon: "emoji_events", points: 15 },
            { title: "Clean Sheet", description: "Complete a match without conceding a goal", icon: "shield", points: 15 }
          ];
          
          for (const achievement of achievementsList) {
            try {
              await storage.createAchievement(achievement);
            } catch (error) {
              console.error(`Failed to create achievement ${achievement.title}:`, error);
            }
          }
        }
        
        // Create upcoming bookings
        const now = new Date();
        const existingBookings = await storage.getBookingsByTeam(team.id);
        const upcomingBookings = existingBookings.filter(b => b.startTime.getTime() > now.getTime());
        
        // Only create new bookings if there are none or fewer than 3 upcoming bookings
        if (upcomingBookings.length < 3) {
          const bookingTemplates = [
            {
              teamId: team.id,
              title: "7-a-side Practice Match",
              location: "Northside Pitch, Field #3",
              format: "7-a-side",
              startTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
              endTime: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
              totalSlots: 14,
              availableSlots: 11
            },
            {
              teamId: team.id,
              title: "5-a-side Tournament",
              location: "Central Park Fields",
              format: "5-a-side",
              startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
              endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours later
              totalSlots: 10,
              availableSlots: 8
            },
            {
              teamId: team.id,
              title: "11-a-side League Match",
              location: "City Stadium, Main Field",
              format: "11-a-side",
              startTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
              endTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
              totalSlots: 22,
              availableSlots: 14
            }
          ];
          
          const createdBookings = [];
          for (const bookingTemplate of bookingTemplates) {
            // Check if similar booking already exists
            const similarBooking = upcomingBookings.find(b => 
              b.title === bookingTemplate.title && 
              b.format === bookingTemplate.format
            );
            
            if (!similarBooking) {
              createdBookings.push(await storage.createBooking(bookingTemplate));
            }
          }
          
          // If we created at least one booking, add players to the first one
          if (createdBookings.length > 0) {
            // Add admin to the booking
            try {
              await storage.createPlayerBooking({
                playerId: admin.id,
                bookingId: createdBookings[0].id,
                status: "confirmed"
              });
            } catch (error) {
              console.error("Failed to add admin to booking:", error);
            }
            
            // Add first player if available
            if (createdPlayers.length >= 1) {
              try {
                await storage.createPlayerBooking({
                  playerId: createdPlayers[0].id,
                  bookingId: createdBookings[0].id,
                  status: "confirmed"
                });
              } catch (error) {
                console.error("Failed to add player 1 to booking:", error);
              }
            }
            
            // Add second player if available
            if (createdPlayers.length >= 2) {
              try {
                await storage.createPlayerBooking({
                  playerId: createdPlayers[1].id,
                  bookingId: createdBookings[0].id,
                  status: "confirmed"
                });
              } catch (error) {
                console.error("Failed to add player 2 to booking:", error);
              }
            }
          }
        }
        
        // Check for existing past bookings
        const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        const pastBookings = await storage.getBookingsByTeam(team.id);
        let pastBooking = pastBookings.find(b => 
          b.title === "Friendly Match" && 
          b.format === "5-a-side" &&
          b.startTime.getTime() < now.getTime()
        );
        
        // Create past booking if it doesn't exist
        if (!pastBooking) {
          pastBooking = await storage.createBooking({
            teamId: team.id,
            title: "Friendly Match",
            location: "Local Pitch",
            format: "5-a-side",
            startTime: pastDate,
            endTime: new Date(pastDate.getTime() + 2 * 60 * 60 * 1000), // 2 hours later
            totalSlots: 10,
            availableSlots: 0
          });
          
          // Create match stats
          await storage.createMatchStats({
            bookingId: pastBooking.id,
            teamScore: 3,
            opponentScore: 1,
            isWin: true,
            isDraw: false,
            isLoss: false
          });
          
          // Create player stats for the past match
          if (createdPlayers.length >= 1 && createdPlayers[0]) {
            await storage.createPlayerStats({
              playerId: createdPlayers[0].id,
              bookingId: pastBooking.id,
              goals: 2,
              assists: 1,
              yellowCards: 0,
              redCards: 0,
              minutesPlayed: 90,
              isInjured: false
            });
          }
          
          if (createdPlayers.length >= 2 && createdPlayers[1]) {
            await storage.createPlayerStats({
              playerId: createdPlayers[1].id,
              bookingId: pastBooking.id,
              goals: 1,
              assists: 0,
              yellowCards: 1,
              redCards: 0,
              minutesPlayed: 90,
              isInjured: false
            });
          }
          
          if (createdPlayers.length >= 3 && createdPlayers[2]) {
            await storage.createPlayerStats({
              playerId: createdPlayers[2].id,
              bookingId: pastBooking.id,
              goals: 0,
              assists: 2,
              yellowCards: 0,
              redCards: 0,
              minutesPlayed: 90,
              isInjured: true
            });
          }
        }
        
        // Log the user in with passport
        if (!req.isAuthenticated()) {
          req.login(admin, (err) => {
            if (err) {
              console.error("Error logging in demo user:", err);
              return res.status(500).json({ message: "Failed to log in demo user" });
            }
            
            // Return success with user info
            return res.json({
              message: "Demo data created successfully",
              admin: { 
                id: admin.id,
                username: admin.username, 
                password: "password",
                name: admin.name,
                email: admin.email,
                role: admin.role,
                teamId: admin.teamId
              }
            });
          });
        } else {
          // Already logged in
          res.json({
            message: "Demo data created successfully",
            admin: { 
              id: admin.id,
              username: admin.username, 
              password: "password",
              name: admin.name,
              email: admin.email,
              role: admin.role,
              teamId: admin.teamId
            }
          });
        }
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    });
  }

  // Stripe payment routes
  app.post("/api/create-payment-intent", requireAuth, async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount) {
        return res.status(400).json({ message: "Amount is required" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Subscription management routes
  app.post("/api/get-or-create-subscription", requireAuth, async (req, res) => {
    try {
      // Authentication is already checked by requireAuth middleware
      const user = req.user as any;
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }

      // If user already has a subscription, retrieve it
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          
          // Return existing subscription info
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
          });
        } catch (error) {
          console.error("Error retrieving subscription:", error);
          // Continue to create a new subscription if the existing one can't be retrieved
        }
      }
      
      if (!user.email) {
        return res.status(400).json({ message: "User email is required" });
      }

      try {
        // Create or get Stripe customer
        let customerId = user.stripeCustomerId;
        
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.name || user.username,
          });
          customerId = customer.id;
        }

        // Create subscription
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{
            price: priceId,
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });

        // Update user with Stripe info
        await storage.updateUserStripeInfo(user.id, customerId, subscription.id);
  
        // Return subscription info for frontend
        res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        });
      } catch (error: any) {
        return res.status(400).json({ error: { message: error.message } });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error processing subscription: " + error.message });
    }
  });

  // Retrieve subscription details
  app.get("/api/subscription", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user.stripeSubscriptionId) {
        return res.json({ subscription: "basic" });
      }

      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        // Map subscription status to plan name
        let plan = "basic";
        
        // Extract the price ID from the subscription
        const priceId = subscription.items.data[0]?.price.id;
        
        // Map price IDs to plan names
        if (priceId) {
          if (priceId.includes("pro")) {
            plan = "pro";
          } else if (priceId.includes("enterprise")) {
            plan = "enterprise";
          }
        }
        
        res.json({ 
          subscription: plan,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        });
      } catch (error) {
        console.error("Error retrieving subscription:", error);
        return res.json({ subscription: "basic" });
      }
    } catch (error: any) {
      res.status(500).json({ message: "Error retrieving subscription: " + error.message });
    }
  });

  // Initialize or retrieve Stripe price IDs
  app.get("/api/stripe/prices", async (req, res) => {
    try {
      // First, check if we have products for our plans
      const products = await stripe.products.list({ limit: 100 });
      
      let proProduct = products.data.find(p => p.name === "Pro Plan");
      let enterpriseProduct = products.data.find(p => p.name === "Enterprise Plan");
      
      // Create products if they don't exist
      if (!proProduct) {
        proProduct = await stripe.products.create({
          name: "Pro Plan",
          description: "For competitive teams"
        });
      }
      
      if (!enterpriseProduct) {
        enterpriseProduct = await stripe.products.create({
          name: "Enterprise Plan",
          description: "For clubs & leagues"
        });
      }
      
      // Get prices for these products
      const prices = await stripe.prices.list({ limit: 100 });
      
      let proPrice = prices.data.find(p => p.product === proProduct.id && p.unit_amount === 2900);
      let enterprisePrice = prices.data.find(p => p.product === enterpriseProduct.id && p.unit_amount === 9900);
      
      // Create prices if they don't exist
      if (!proPrice) {
        proPrice = await stripe.prices.create({
          product: proProduct.id,
          unit_amount: 2900, // $29.00
          currency: 'usd',
          recurring: { interval: 'month' }
        });
      }
      
      if (!enterprisePrice) {
        enterprisePrice = await stripe.prices.create({
          product: enterpriseProduct.id,
          unit_amount: 9900, // $99.00
          currency: 'usd',
          recurring: { interval: 'month' }
        });
      }
      
      // Return the price IDs
      res.json({
        pro: proPrice.id,
        enterprise: enterprisePrice.id
      });
    } catch (error: any) {
      console.error("Error initializing Stripe prices:", error);
      res.status(500).json({ message: "Error initializing Stripe prices: " + error.message });
    }
  });

  // Handle webhook events from Stripe
  app.post("/api/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    let event;
    
    try {
      // Verify webhook signature
      if (process.env.STRIPE_WEBHOOK_SECRET) {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } else {
        // For development without webhook signature verification
        event = JSON.parse(req.body.toString());
      }
      
      // Handle specific events
      switch (event.type) {
        case 'checkout.session.completed':
          // Payment was successful, update user subscription
          const session = event.data.object;
          if (session.customer) {
            // Find user by customer ID and update their subscription
            // In a real app, you'd need to store metadata to identify the user
            console.log('Checkout session completed:', session);
          }
          break;
          
        case 'invoice.payment_succeeded':
          // Handle successful subscription payment
          const invoice = event.data.object;
          console.log('Invoice payment succeeded:', invoice);
          break;
          
        case 'customer.subscription.deleted':
          // Handle subscription cancelation
          const subscription = event.data.object;
          console.log('Subscription deleted:', subscription);
          // Find user by subscription ID and update their status
          break;
          
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  app.get("/api/teams/:id/billing", requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const user = req.user as any;
      
      // Ensure user is the admin of the team
      if (user.role !== "admin" || user.teamId !== teamId) {
        return res.status(403).json({ message: "Not authorized to view billing" });
      }
      
      // Get team owner
      const owner = await storage.getUser(team.ownerId);
      
      if (!owner || !owner.stripeCustomerId) {
        return res.json([]);
      }
      
      try {
        // Get invoices from Stripe
        const invoices = await stripe.invoices.list({
          customer: owner.stripeCustomerId,
          limit: 10,
        });
        
        // Format invoices for response
        const billingHistory = invoices.data.map(invoice => ({
          id: invoice.id,
          date: new Date(invoice.created * 1000).toISOString().split('T')[0],
          amount: `$${(invoice.total / 100).toFixed(2)}`,
          status: invoice.paid ? "Paid" : "Unpaid",
          description: invoice.lines.data[0]?.description || "Subscription"
        }));
        
        res.json(billingHistory);
      } catch (error) {
        console.error("Error retrieving invoices:", error);
        return res.json([]);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Credits API
  app.get('/api/credits', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const userId = req.user.id;
      const credits = await storage.getUserCredits(userId);
      const transactions = await storage.getTransactionsByUser(userId);

      res.json({
        credits,
        transactions
      });
    } catch (error) {
      console.error('Error fetching credits:', error);
      res.status(500).json({ message: 'Failed to fetch credits information' });
    }
  });

  app.post('/api/credits/add', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { amount } = req.body;
    if (!amount || amount < 5) {
      return res.status(400).json({ message: 'Invalid amount. Minimum amount is 5 credits.' });
    }

    try {
      const userId = req.user.id;
      // In a real application, you would process a payment here with Stripe
      // For this demo, we'll just add the credits directly
      const user = await storage.addUserCredits(userId, amount, 'purchase', 'Credit purchase');
      
      res.json({
        message: 'Credits added successfully',
        credits: user.credits
      });
    } catch (error) {
      console.error('Error adding credits:', error);
      res.status(500).json({ message: 'Failed to add credits' });
    }
  });

  // Team Invitation API
  app.get('/api/teams/:id/invitation', requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
      
      const user = req.user as any;
      
      // Ensure user is admin of the team
      if (team.ownerId !== user.id) {
        return res.status(403).json({ message: 'Not authorized to manage team invitations' });
      }
      
      // Generate invitation code if it doesn't exist
      if (!team.invitationCode) {
        const invitationCode = Math.random().toString(36).substring(2, 12).toUpperCase();
        await storage.updateTeam(teamId, { invitationCode });
        team.invitationCode = invitationCode;
      }
      
      res.json({ 
        teamId: team.id,
        teamName: team.name,
        invitationCode: team.invitationCode
      });
    } catch (error) {
      console.error('Error getting team invitation:', error);
      res.status(500).json({ message: 'Failed to get team invitation' });
    }
  });

  app.post('/api/teams/join', async (req, res) => {
    const { invitationCode } = req.body;
    
    if (!invitationCode) {
      return res.status(400).json({ message: 'Invitation code is required' });
    }
    
    try {
      // Find team by invitation code
      const teams = await db.select().from(teamSchema).where(eq(teamSchema.invitationCode, invitationCode));
      const team = teams[0];
      
      if (!team) {
        return res.status(404).json({ message: 'Invalid invitation code' });
      }
      
      res.json({ 
        teamId: team.id,
        teamName: team.name
      });
    } catch (error) {
      console.error('Error joining team with invitation:', error);
      res.status(500).json({ message: 'Failed to join team' });
    }
  });

  app.post('/api/auth/register-with-team', async (req, res) => {
    const { name, email, username, password, teamId } = req.body;

    if (!name || !email || !username || !password || !teamId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    try {
      // Check if team exists
      const team = await storage.getTeam(teamId);
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username) || await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'Username or email already exists' });
      }

      // Create user with teamId
      const user = await storage.createUser({
        name,
        email,
        username,
        password,
        role: 'player',
        teamId,
        isActive: true,
        credits: 0
      });

      res.status(201).json({ 
        message: 'User registered successfully',
        userId: user.id
      });
    } catch (error) {
      console.error('Error registering user with team:', error);
      res.status(500).json({ message: 'Failed to register user' });
    }
  });

  // Credits API endpoints
  app.get('/api/credits/transactions', requireAuth, async (req, res) => {
    try {
      const userId = req.user.id;
      const transactions = await storage.getTransactionsByUser(userId);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching credit transactions:', error);
      res.status(500).json({ message: 'Failed to fetch credit transactions' });
    }
  });

  app.post('/api/credits/purchase', requireAuth, async (req, res) => {
    try {
      const { amount, paymentMethod } = req.body;
      
      if (!amount || amount < 5) {
        return res.status(400).json({ message: 'Minimum purchase amount is 5 credits' });
      }
      
      if (amount > 1000) {
        return res.status(400).json({ message: 'Maximum purchase amount is 1000 credits' });
      }
      
      const userId = req.user.id;
      const pricePerCredit = 1; // $1 per credit
      const amountInCents = Math.round(amount * pricePerCredit * 100);
      
      if (paymentMethod === 'stripe') {
        // Create a payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'usd',
          metadata: {
            type: 'credit_purchase',
            userId: userId.toString(),
            credits: amount.toString()
          }
        });
        
        // Create a pending transaction
        await storage.createCreditTransaction({
          type: 'purchase',
          amount: amount,
          userId: userId,
          status: 'pending',
          description: `Purchase of ${amount} credits`
        });
        
        res.json({
          clientSecret: paymentIntent.client_secret,
          amount: amount
        });
      } else {
        res.status(400).json({ message: 'Invalid payment method' });
      }
    } catch (error) {
      console.error('Error creating credit purchase:', error);
      res.status(500).json({ message: 'Failed to process credit purchase' });
    }
  });

  app.post('/api/credits/webhook', async (req, res) => {
    const payload = req.body;
    let event;
    
    try {
      // Verify and construct the webhook event
      event = stripe.webhooks.constructEvent(
        payload, 
        req.headers['stripe-signature'], 
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }
    
    // Handle different event types
    if (event.type === 'payment_intent.succeeded') {
      try {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;
        
        if (metadata.type === 'credit_purchase') {
          const userId = parseInt(metadata.userId);
          const credits = parseInt(metadata.credits);
          
          // Add credits to the user
          await storage.addUserCredits(userId, credits, 'purchase', 'Credit purchase successful');
          
          // Update related transaction status
          const transactions = await storage.getTransactionsByUser(userId);
          const pendingTransaction = transactions.find(
            tx => tx.type === 'purchase' && tx.amount === credits && tx.status === 'pending'
          );
          
          if (pendingTransaction) {
            await storage.updateTransactionStatus(pendingTransaction.id, 'completed');
          }
        }
      } catch (error) {
        console.error('Error processing payment success webhook:', error);
        return res.status(500).send('Error processing payment success');
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      try {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;
        
        if (metadata.type === 'credit_purchase') {
          const userId = parseInt(metadata.userId);
          const credits = parseInt(metadata.credits);
          
          // Update transaction status to failed
          const transactions = await storage.getTransactionsByUser(userId);
          const pendingTransaction = transactions.find(
            tx => tx.type === 'purchase' && tx.amount === credits && tx.status === 'pending'
          );
          
          if (pendingTransaction) {
            await storage.updateTransactionStatus(pendingTransaction.id, 'failed');
          }
        }
      } catch (error) {
        console.error('Error processing payment failure webhook:', error);
        return res.status(500).send('Error processing payment failure');
      }
    }
    
    res.json({ received: true });
  });

  app.post('/api/credits/use', requireAuth, async (req, res) => {
    try {
      const { amount, bookingId, description } = req.body;
      const userId = req.user.id;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid credit amount' });
      }
      
      if (!bookingId) {
        return res.status(400).json({ message: 'Booking ID is required' });
      }
      
      // Check if user has enough credits
      const userCredits = await storage.getUserCredits(userId);
      
      if (userCredits < amount) {
        return res.status(400).json({ message: 'Insufficient credits' });
      }
      
      // Use credits and create transaction
      const success = await storage.useUserCredits(userId, amount, bookingId, description);
      
      if (success) {
        res.json({ success: true, remainingCredits: userCredits - amount });
      } else {
        res.status(500).json({ message: 'Failed to use credits' });
      }
    } catch (error) {
      console.error('Error using credits:', error);
      res.status(500).json({ message: 'Failed to use credits' });
    }
  });

  // Achievement API endpoints
  app.get('/api/achievements', async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ message: 'Failed to fetch achievements' });
    }
  });

  app.get('/api/players/:id/achievements', requireAuth, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      
      // Optional security check to ensure users can only see their own achievements
      // unless they are an admin
      const user = req.user as any;
      if (user.id !== playerId && user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to view these achievements' });
      }
      
      const playerAchievements = await storage.getPlayerAchievements(playerId);
      res.json(playerAchievements);
    } catch (error) {
      console.error('Error fetching player achievements:', error);
      res.status(500).json({ message: 'Failed to fetch player achievements' });
    }
  });

  app.post('/api/players/:id/achievements/:achievementId', requireAuth, async (req, res) => {
    try {
      const playerId = parseInt(req.params.id);
      const achievementId = parseInt(req.params.achievementId);
      
      // Only admins can manually assign achievements
      const user = req.user as any;
      if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to assign achievements' });
      }
      
      const success = await storage.addPlayerAchievement(playerId, achievementId);
      
      if (success) {
        res.json({ success: true, message: 'Achievement assigned successfully' });
      } else {
        res.status(400).json({ message: 'Failed to assign achievement' });
      }
    } catch (error) {
      console.error('Error assigning achievement:', error);
      res.status(500).json({ message: 'Failed to assign achievement' });
    }
  });

  // Team Invitation API endpoints
  app.post('/api/teams/join', async (req, res) => {
    try {
      const { invitationCode } = req.body;
      
      if (!invitationCode) {
        return res.status(400).json({ message: 'Invitation code is required' });
      }
      
      // Find team by invitation code
      const teams = await storage.getTeams();
      const team = teams.find(t => t.invitationCode === invitationCode);
      
      if (!team) {
        return res.status(404).json({ message: 'Invalid invitation code' });
      }
      
      res.json({
        teamId: team.id,
        teamName: team.name
      });
    } catch (error) {
      console.error('Error verifying team invitation:', error);
      res.status(500).json({ message: 'Failed to verify invitation code' });
    }
  });

  app.post('/api/teams/:teamId/invitation/regenerate', requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = req.user.id;
      
      // Check if user is team owner
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
      
      if (team.ownerId !== userId) {
        return res.status(403).json({ message: 'Only team owner can regenerate invitation code' });
      }
      
      // Generate new invitation code
      const invitationCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Update team with new invitation code
      const updatedTeam = await storage.updateTeam(teamId, { invitationCode });
      
      res.json({
        invitationCode: updatedTeam.invitationCode
      });
    } catch (error) {
      console.error('Error regenerating invitation code:', error);
      res.status(500).json({ message: 'Failed to regenerate invitation code' });
    }
  });

  app.get('/api/teams/:teamId/invitation', requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = req.user.id;
      
      // Get team
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
      
      // Check if user is team owner or member
      if (team.ownerId !== userId && (!req.user.teamId || req.user.teamId !== teamId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json({
        teamName: team.name,
        invitationCode: team.invitationCode
      });
    } catch (error) {
      console.error('Error fetching team invitation:', error);
      res.status(500).json({ message: 'Failed to fetch team invitation' });
    }
  });

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const notifications = await storage.getNotifications(user.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/unread", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const notifications = await storage.getUnreadNotifications(user.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const success = await storage.markAllNotificationsAsRead(user.id);
      res.json({ success });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const success = await storage.deleteNotification(notificationId);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Cancellation routes
  app.post("/api/bookings/:id/cancel", requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const user = req.user as any;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Cancellation reason is required" });
      }
      
      // Check if the user is the team owner
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      const team = await storage.getTeam(booking.teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // If user is team owner, they can cancel the entire booking
      if (team.ownerId === user.id) {
        const result = await cancelEntireBooking(user.id, bookingId, reason);
        return res.json(result);
      }
      
      // Otherwise, check if the user has booked this match
      const playerBookings = await storage.getPlayerBookingsByBooking(bookingId);
      const userBooking = playerBookings.find(pb => pb.playerId === user.id);
      
      if (!userBooking) {
        return res.status(403).json({ message: "You haven't booked this match" });
      }
      
      // Process individual cancellation
      const result = await processCancellation(userBooking.id, reason);
      return res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Weather forecast route
  app.get("/api/bookings/:id/weather", requireAuth, async (req, res) => {
    try {
      const bookingId = parseInt(req.params.id);
      const booking = await storage.getBooking(bookingId);
      
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      
      // If weather data already exists in the booking, return it
      if (booking.weatherData) {
        return res.json(booking.weatherData);
      }
      
      // Otherwise fetch and update the weather data
      const weather = await getWeatherForBooking(bookingId);
      
      if (!weather) {
        return res.status(404).json({ message: "Weather data not available" });
      }
      
      res.json(weather);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
