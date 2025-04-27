/**
 * Cancellation Service - Manages booking cancellation policies
 * 
 * Handles:
 * - Checking if a booking can be cancelled
 * - Calculating refund amounts
 * - Processing cancellations
 * - Enforcing team cancellation policies
 */

import { storage } from "../storage";
import { Booking, PlayerBooking, Team, User } from "@shared/schema";
import { CANCELLATION_POLICY } from "../config";
import { sendCancellationNotification } from "./notification-service";

interface CancellationResult {
  success: boolean;
  message: string;
  refundAmount?: number;
}

// Check if a player can cancel their booking
export async function canCancelBooking(
  userId: number,
  bookingId: number
): Promise<CancellationResult> {
  try {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }
    
    // Get the booking
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      return { success: false, message: "Booking not found" };
    }
    
    // Get the player booking
    const playerBookings = await storage.getPlayerBookingsByBooking(bookingId);
    const playerBooking = playerBookings.find(pb => pb.playerId === userId);
    
    if (!playerBooking) {
      return { success: false, message: "You are not part of this booking" };
    }
    
    if (playerBooking.status !== "confirmed") {
      return { success: false, message: "Booking is not in a confirmed state" };
    }
    
    // Get the team for team-specific cancellation policies
    const team = await storage.getTeam(booking.teamId);
    if (!team) {
      return { success: false, message: "Team not found" };
    }
    
    // Check if user has exceeded monthly cancellation limit
    if (user.cancellationsThisMonth && 
        user.cancellationsThisMonth >= CANCELLATION_POLICY.MAX_CANCELLATIONS_PER_MONTH) {
      return { 
        success: false, 
        message: `You've reached the maximum ${CANCELLATION_POLICY.MAX_CANCELLATIONS_PER_MONTH} cancellations allowed per month` 
      };
    }
    
    // Check if it's too close to match time to cancel
    const now = new Date();
    const hoursUntilMatch = (booking.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Use team-specific cancellation hours if defined, otherwise use default
    let minCancellationHours = CANCELLATION_POLICY.MIN_CANCELLATION_HOURS;
    let refundPercentage = CANCELLATION_POLICY.DEFAULT_REFUND_PERCENTAGE;
    
    // Check for team-specific cancellation policy
    if (team.cancellationPolicy) {
      const teamPolicy = team.cancellationPolicy as any;
      
      if (teamPolicy.minCancellationHours !== undefined) {
        minCancellationHours = teamPolicy.minCancellationHours;
      }
      
      if (teamPolicy.refundPercentage !== undefined) {
        refundPercentage = teamPolicy.refundPercentage;
      }
    }
    
    if (hoursUntilMatch < minCancellationHours) {
      return { 
        success: false, 
        message: `Cancellations are not allowed within ${minCancellationHours} hours of the match` 
      };
    }
    
    // Calculate refund amount (usually 1 credit per player, but team might have custom credit costs)
    const creditCost = booking.creditCost || 1;
    const refundAmount = Math.round((refundPercentage / 100) * creditCost);
    
    return { 
      success: true, 
      message: "Booking can be cancelled", 
      refundAmount 
    };
  } catch (error) {
    console.error("Error checking cancellation eligibility:", error);
    return { success: false, message: "An error occurred while checking cancellation eligibility" };
  }
}

// Process a booking cancellation
export async function processCancellation(
  userId: number,
  bookingId: number,
  reason?: string
): Promise<CancellationResult> {
  try {
    // First check if cancellation is allowed
    const cancellationCheck = await canCancelBooking(userId, bookingId);
    
    if (!cancellationCheck.success) {
      return cancellationCheck;
    }
    
    // Get the booking
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      return { success: false, message: "Booking not found" };
    }
    
    // Get the player booking
    const playerBookings = await storage.getPlayerBookingsByBooking(bookingId);
    const playerBooking = playerBookings.find(pb => pb.playerId === userId);
    
    if (!playerBooking) {
      return { success: false, message: "You are not part of this booking" };
    }
    
    // Update player booking status to cancelled
    const refundAmount = cancellationCheck.refundAmount || 0;
    await storage.updatePlayerBooking(playerBooking.id, {
      status: "canceled",
      cancellationReason: reason,
      refundAmount,
      canceledAt: new Date()
    });
    
    // Update booking available slots
    await storage.updateBooking(bookingId, {
      availableSlots: booking.availableSlots + 1
    });
    
    // Process refund by creating a credit transaction
    if (refundAmount > 0) {
      await storage.createCreditTransaction({
        userId,
        amount: refundAmount,
        type: "refund",
        bookingId,
        description: `Refund for cancellation of ${booking.title}`,
        status: "completed"
      });
      
      // Add credits back to user account
      await storage.addUserCredits(userId, refundAmount, "refund", `Booking cancellation: ${booking.title}`, null);
    }
    
    // Increment user's cancellation count for the month
    const user = await storage.getUser(userId);
    if (user) {
      // Reset counter if this is the first cancellation of the month
      const now = new Date();
      const currentMonth = now.getMonth();
      const lastResetMonth = user.lastCancellationReset 
        ? user.lastCancellationReset.getMonth() 
        : -1;
      
      if (currentMonth !== lastResetMonth) {
        // First cancellation of a new month
        await storage.updateUser(userId, {
          cancellationsThisMonth: 1,
          lastCancellationReset: now
        });
      } else {
        // Increment existing counter
        await storage.updateUser(userId, {
          cancellationsThisMonth: (user.cancellationsThisMonth || 0) + 1
        });
      }
      
      // Send cancellation notification
      await sendCancellationNotification(userId, booking, refundAmount);
    }
    
    return { 
      success: true, 
      message: "Booking successfully cancelled", 
      refundAmount 
    };
  } catch (error) {
    console.error("Error processing cancellation:", error);
    return { success: false, message: "An error occurred while processing cancellation" };
  }
}