import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import express from "express";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { z } from "zod";
import Stripe from "stripe";
import { 
  insertUserSchema, 
  insertTeamSchema, 
  insertBookingSchema,
  insertPlayerBookingSchema, 
  insertMatchStatsSchema,
  insertPlayerStatsSchema
} from "@shared/schema";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: "2022-11-15", // Use a supported API version
});
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

  app.get("/api/teams/:id", requireAuth, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json(team);
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
        // Create admin user
        const admin = await storage.createUser({
          username: "admin",
          password: "password",
          email: "admin@example.com",
          name: "John Coach",
          role: "admin"
        });
        
        // Create team
        const team = await storage.createTeam({
          name: "Football Stars",
          ownerId: admin.id,
          subscription: "basic"
        });
        
        // Update admin with team id
        await storage.updateUser(admin.id, { teamId: team.id });
        
        // Create players
        const players = [
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
        for (const player of players) {
          createdPlayers.push(await storage.createUser(player));
        }
        
        // Create bookings
        const now = new Date();
        const bookings = [
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
        for (const booking of bookings) {
          createdBookings.push(await storage.createBooking(booking));
        }
        
        // Add players to bookings
        await storage.createPlayerBooking({
          playerId: admin.id,
          bookingId: createdBookings[0].id,
          status: "confirmed"
        });
        
        await storage.createPlayerBooking({
          playerId: createdPlayers[0].id,
          bookingId: createdBookings[0].id,
          status: "confirmed"
        });
        
        await storage.createPlayerBooking({
          playerId: createdPlayers[1].id,
          bookingId: createdBookings[0].id,
          status: "confirmed"
        });
        
        // Create match stats for a past match
        const pastBooking = await storage.createBooking({
          teamId: team.id,
          title: "Friendly Match",
          location: "Local Pitch",
          format: "5-a-side",
          startTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          endTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours later
          totalSlots: 10,
          availableSlots: 0
        });
        
        await storage.createMatchStats({
          bookingId: pastBooking.id,
          teamScore: 3,
          opponentScore: 1,
          isWin: true,
          isDraw: false,
          isLoss: false
        });
        
        // Create player stats for the past match
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
        
        res.json({
          message: "Demo data created successfully",
          admin: { username: admin.username, password: "password" }
        });
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

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

  const httpServer = createServer(app);
  return httpServer;
}
