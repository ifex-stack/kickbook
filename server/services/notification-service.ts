/**
 * Notification Service - Manages user notifications
 * 
 * Handles:
 * - Sending match reminders
 * - Booking confirmations
 * - Cancellation notifications
 * - Team updates
 */

import { storage } from "../storage";
import { Booking, User, InsertNotification } from "@shared/schema";
import { NOTIFICATION_SETTINGS } from "../config";

// Notification types
export const NOTIFICATION_TYPES = {
  MATCH_REMINDER: "match_reminder",
  BOOKING_CONFIRMATION: "booking_confirmation",
  CANCELLATION: "cancellation",
  TEAM_UPDATE: "team_update",
  CREDIT_PURCHASE: "credit_purchase",
  CREDIT_REFUND: "credit_refund",
  WEATHER_ALERT: "weather_alert"
};

// Create and send a notification to a user
export async function sendNotification(
  userId: number,
  title: string,
  message: string,
  type: string,
  bookingId?: number
) {
  try {
    // Get user to check notification preferences
    const user = await storage.getUser(userId);
    
    if (!user) {
      console.error(`Cannot send notification - user ${userId} not found`);
      return null;
    }
    
    // Check user notification preferences (if set)
    if (user.notificationSettings) {
      const settings = user.notificationSettings as any;
      
      // Skip if notifications are disabled for this type
      if (settings[type + "Enabled"] === false) {
        return null;
      }
    }
    
    // Create notification in database
    const notification: InsertNotification = {
      userId,
      title,
      message,
      type,
      bookingId,
      isRead: false
    };
    
    return await storage.createNotification(notification);
  } catch (error) {
    console.error("Error sending notification:", error);
    return null;
  }
}

// Send a booking confirmation notification
export async function sendBookingConfirmation(userId: number, booking: Booking) {
  const title = "Booking Confirmed";
  const message = `Your booking for ${booking.title} on ${formatDate(booking.startTime)} has been confirmed.`;
  
  return sendNotification(
    userId,
    title,
    message,
    NOTIFICATION_TYPES.BOOKING_CONFIRMATION,
    booking.id
  );
}

// Send a match reminder notification
export async function sendMatchReminder(userId: number, booking: Booking) {
  const title = "Upcoming Match Reminder";
  const message = `You have a match tomorrow: ${booking.title} at ${booking.location}, starting at ${formatTime(booking.startTime)}.`;
  
  return sendNotification(
    userId,
    title,
    message,
    NOTIFICATION_TYPES.MATCH_REMINDER,
    booking.id
  );
}

// Send a cancellation notification
export async function sendCancellationNotification(userId: number, booking: Booking, refundAmount: number) {
  const title = "Booking Cancelled";
  const message = `Your booking for ${booking.title} has been cancelled. ${refundAmount} credits have been refunded to your account.`;
  
  return sendNotification(
    userId,
    title,
    message,
    NOTIFICATION_TYPES.CANCELLATION,
    booking.id
  );
}

// Send a weather alert notification
export async function sendWeatherAlert(userId: number, booking: Booking, weatherDescription: string) {
  const title = "Weather Alert";
  const message = `Weather alert for your booking ${booking.title}: ${weatherDescription}. Please check the forecast and plan accordingly.`;
  
  return sendNotification(
    userId,
    title,
    message,
    NOTIFICATION_TYPES.WEATHER_ALERT,
    booking.id
  );
}

// Send a credit purchase confirmation
export async function sendCreditPurchaseConfirmation(userId: number, amount: number) {
  const title = "Credits Purchased";
  const message = `Your purchase of ${amount} credits has been confirmed.`;
  
  return sendNotification(
    userId,
    title,
    message,
    NOTIFICATION_TYPES.CREDIT_PURCHASE
  );
}

// Format date helper
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Format time helper
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Send match reminders for all upcoming bookings
export async function sendMatchRemindersBatch() {
  try {
    // Get the date for "tomorrow"
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format dates to compare just the date part (ignore time)
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    // Get all upcoming bookings
    const allBookings = await storage.getAllBookings();
    
    // Filter bookings happening tomorrow
    const tomorrowBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime).toISOString().split('T')[0];
      return bookingDate === tomorrowDate;
    });
    
    // Send reminder to all players in each booking
    for (const booking of tomorrowBookings) {
      const playerBookings = await storage.getPlayerBookingsByBooking(booking.id);
      
      for (const playerBooking of playerBookings) {
        // Only send to confirmed players
        if (playerBooking.status === "confirmed") {
          await sendMatchReminder(playerBooking.playerId, booking);
        }
      }
    }
    
    return { sent: tomorrowBookings.length };
  } catch (error) {
    console.error("Error sending match reminders batch:", error);
    return { error: "Failed to send reminders" };
  }
}