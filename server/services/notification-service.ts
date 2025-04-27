/**
 * Notification Service - Manages system notifications
 * 
 * Handles:
 * - Match reminders
 * - Achievement notifications
 * - Booking confirmations
 * - Team invitations
 * - Payment confirmations
 */

import { storage } from "../storage";
import { InsertNotification } from "@shared/schema";

// Types of notifications
export enum NotificationType {
  MATCH_REMINDER = "match_reminder",
  BOOKING_CONFIRMATION = "booking_confirmation",
  ACHIEVEMENT = "achievement",
  TEAM_INVITATION = "team_invitation",
  PAYMENT_CONFIRMATION = "payment_confirmation",
  MATCH_CANCELED = "match_canceled",
  MATCH_DETAILS_UPDATED = "match_details_updated"
}

// Time thresholds for match reminders
export const NOTIFICATION_THRESHOLDS = {
  MATCH_REMINDER_DAY_BEFORE: 24 * 60 * 60 * 1000, // 24 hours before
  MATCH_REMINDER_HOUR_BEFORE: 1 * 60 * 60 * 1000, // 1 hour before
};

/**
 * Send a notification to a user
 * @param userId ID of the user to notify
 * @param title Title of the notification
 * @param message Message content
 * @param type Type of notification
 * @param metadata Optional metadata
 */
export async function sendNotification(
  userId: number,
  title: string,
  message: string,
  type: NotificationType,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const notification: InsertNotification = {
      userId,
      title,
      message,
      type,
      metadata: metadata || {},
      isRead: false
    } as InsertNotification; // Type assertion to fix metadata field compatibility

    await storage.createNotification(notification);
    return true;
  } catch (error) {
    console.error(`Failed to send notification to user ${userId}:`, error);
    return false;
  }
}

/**
 * Send match reminder notifications to all players booked for a match
 * @param bookingId ID of the booking (match)
 * @param hoursBefore Hours before the match to send notification
 */
export async function sendMatchReminders(bookingId: number, hoursBefore: number): Promise<void> {
  try {
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      console.error(`Cannot send match reminders: Booking ${bookingId} not found`);
      return;
    }

    // Get the team info
    const team = await storage.getTeam(booking.teamId);
    if (!team) {
      console.error(`Cannot send match reminders: Team for booking ${bookingId} not found`);
      return;
    }

    // Get all players booked for this match
    const playerBookings = await storage.getPlayerBookingsByBooking(bookingId);
    
    // Send notification to each player
    const timeText = hoursBefore === 24 ? "tomorrow" : `in ${hoursBefore} hour${hoursBefore > 1 ? 's' : ''}`;
    for (const playerBooking of playerBookings) {
      const player = await storage.getUser(playerBooking.playerId);
      if (!player) continue;

      await sendNotification(
        player.id,
        `Match Reminder: ${team.name}`,
        `Your match at ${booking.location} is scheduled to start ${timeText} at ${booking.startTime.toLocaleTimeString()}.`,
        NotificationType.MATCH_REMINDER,
        { bookingId }
      );
    }

    console.log(`Sent match reminders for booking ${bookingId}`);
  } catch (error) {
    console.error(`Error sending match reminders:`, error);
  }
}

/**
 * Send a booking confirmation to a player
 * @param playerId ID of the player
 * @param bookingId ID of the booking
 */
export async function sendBookingConfirmation(playerId: number, bookingId: number): Promise<void> {
  try {
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      console.error(`Cannot send booking confirmation: Booking ${bookingId} not found`);
      return;
    }

    const player = await storage.getUser(playerId);
    if (!player) {
      console.error(`Cannot send booking confirmation: Player ${playerId} not found`);
      return;
    }

    // Get the team info
    const team = await storage.getTeam(booking.teamId);
    if (!team) {
      console.error(`Cannot send booking confirmation: Team for booking ${bookingId} not found`);
      return;
    }

    await sendNotification(
      playerId,
      `Booking Confirmed: ${team.name}`,
      `Your booking for ${booking.title} at ${booking.location} on ${booking.startTime.toLocaleDateString()} has been confirmed.`,
      NotificationType.BOOKING_CONFIRMATION,
      { bookingId }
    );

    console.log(`Sent booking confirmation to player ${playerId} for booking ${bookingId}`);
  } catch (error) {
    console.error(`Error sending booking confirmation:`, error);
  }
}

/**
 * Send an achievement notification to a player
 * @param playerId ID of the player
 * @param achievementId ID of the achievement
 */
export async function sendAchievementNotification(playerId: number, achievementId: number): Promise<void> {
  try {
    const player = await storage.getUser(playerId);
    if (!player) {
      console.error(`Cannot send achievement notification: Player ${playerId} not found`);
      return;
    }

    // Get all achievements
    const achievements = await storage.getAchievements();
    const achievement = achievements.find(a => a.id === achievementId);
    
    if (!achievement) {
      console.error(`Cannot send achievement notification: Achievement ${achievementId} not found`);
      return;
    }

    await sendNotification(
      playerId,
      "Achievement Unlocked!",
      `Congratulations! You've earned the "${achievement.title}" achievement: ${achievement.description}`,
      NotificationType.ACHIEVEMENT,
      { achievementId }
    );

    console.log(`Sent achievement notification to player ${playerId} for achievement ${achievementId}`);
  } catch (error) {
    console.error(`Error sending achievement notification:`, error);
  }
}

/**
 * Send a team invitation notification
 * @param receiverId ID of the user receiving the invitation
 * @param teamId ID of the team
 * @param invitedByName Name of the user who sent the invitation
 */
export async function sendTeamInvitation(receiverId: number, teamId: number, invitedByName: string): Promise<void> {
  try {
    const receiver = await storage.getUser(receiverId);
    if (!receiver) {
      console.error(`Cannot send team invitation: User ${receiverId} not found`);
      return;
    }

    const team = await storage.getTeam(teamId);
    if (!team) {
      console.error(`Cannot send team invitation: Team ${teamId} not found`);
      return;
    }

    await sendNotification(
      receiverId,
      `Team Invitation: ${team.name}`,
      `${invitedByName} has invited you to join ${team.name}. Check your team invitations to respond.`,
      NotificationType.TEAM_INVITATION,
      { teamId, invitationCode: team.invitationCode }
    );

    console.log(`Sent team invitation to user ${receiverId} for team ${teamId}`);
  } catch (error) {
    console.error(`Error sending team invitation:`, error);
  }
}

/**
 * Send a payment confirmation notification
 * @param userId ID of the user
 * @param amount Amount paid
 * @param credits Number of credits purchased
 * @param transactionId ID of the transaction
 */
export async function sendPaymentConfirmation(userId: number, amount: number, credits: number, transactionId: number): Promise<void> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      console.error(`Cannot send payment confirmation: User ${userId} not found`);
      return;
    }

    await sendNotification(
      userId,
      "Payment Confirmation",
      `Your payment of £${amount.toFixed(2)} for ${credits} credits has been processed successfully.`,
      NotificationType.PAYMENT_CONFIRMATION,
      { transactionId, amount, credits }
    );

    console.log(`Sent payment confirmation to user ${userId} for transaction ${transactionId}`);
  } catch (error) {
    console.error(`Error sending payment confirmation:`, error);
  }
}

/**
 * Send notification that a match has been canceled
 * @param bookingId ID of the booking that was canceled
 */
export async function sendMatchCanceledNotification(bookingId: number): Promise<void> {
  try {
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      console.error(`Cannot send match canceled notification: Booking ${bookingId} not found`);
      return;
    }

    // Get the team info
    const team = await storage.getTeam(booking.teamId);
    if (!team) {
      console.error(`Cannot send match canceled notification: Team for booking ${bookingId} not found`);
      return;
    }

    // Get all players booked for this match
    const playerBookings = await storage.getPlayerBookingsByBooking(bookingId);
    
    // Send notification to each player
    for (const playerBooking of playerBookings) {
      const player = await storage.getUser(playerBooking.playerId);
      if (!player) continue;

      await sendNotification(
        player.id,
        `Match Canceled: ${team.name}`,
        `The match scheduled for ${booking.startTime.toLocaleDateString()} at ${booking.location} has been canceled.`,
        NotificationType.MATCH_CANCELED,
        { bookingId }
      );
    }

    console.log(`Sent match canceled notifications for booking ${bookingId}`);
  } catch (error) {
    console.error(`Error sending match canceled notifications:`, error);
  }
}

/**
 * Schedule background task to send match reminder notifications
 * Should be called on server startup
 */
export async function scheduleMatchReminders(): Promise<void> {
  // Run every hour
  setInterval(async () => {
    try {
      console.log("Running scheduled match reminder check...");
      const now = new Date();
      
      // Get all upcoming bookings
      const allBookings = await storage.getAllBookings();
      const upcomingBookings = allBookings.filter(booking => {
        const bookingTime = new Date(booking.startTime);
        
        // Only include bookings that haven't started yet
        return bookingTime > now;
      });
      
      for (const booking of upcomingBookings) {
        const bookingTime = new Date(booking.startTime);
        const timeUntilMatch = bookingTime.getTime() - now.getTime();
        
        // Send day-before notification
        if (
          timeUntilMatch <= NOTIFICATION_THRESHOLDS.MATCH_REMINDER_DAY_BEFORE &&
          timeUntilMatch > NOTIFICATION_THRESHOLDS.MATCH_REMINDER_DAY_BEFORE - 60 * 60 * 1000 // 1 hour window
        ) {
          await sendMatchReminders(booking.id, 24);
        }
        
        // Send hour-before notification
        if (
          timeUntilMatch <= NOTIFICATION_THRESHOLDS.MATCH_REMINDER_HOUR_BEFORE &&
          timeUntilMatch > NOTIFICATION_THRESHOLDS.MATCH_REMINDER_HOUR_BEFORE - 10 * 60 * 1000 // 10 minute window
        ) {
          await sendMatchReminders(booking.id, 1);
        }
      }
    } catch (error) {
      console.error("Error in match reminder scheduler:", error);
    }
  }, 60 * 60 * 1000); // Run hourly
  
  console.log("Match reminder scheduler initialized");
}