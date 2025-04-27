/**
 * Cancellation Service - Manages booking cancellations and refund policies
 */

import { storage } from "../storage";
import { sendMatchCanceledNotification } from "./notification-service";

// Cancellation policy configuration - can be moved to team settings later
export interface CancellationPolicy {
  maxCancellationsPerMonth: number;          // Maximum allowed cancellations per month
  minHoursBeforeForCancellation: number;     // Minimum hours before match to allow cancellation
  refundPercent: number;                     // Percentage of credits to refund (0-100)
  refundDeadlineHours: number;               // Hours before match when refund percentage changes
  earlyRefundPercent: number;                // Refund percentage for early cancellations
  allowTeamOwnerOverride: boolean;           // Whether team owner can override these settings
}

// Default team cancellation policy
export const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  maxCancellationsPerMonth: 2,
  minHoursBeforeForCancellation: 6,
  refundPercent: 50,              // 50% refund for regular cancellations
  refundDeadlineHours: 24,        // 24 hours before match is the cutoff for early cancellation
  earlyRefundPercent: 100,        // 100% refund for early cancellations
  allowTeamOwnerOverride: true    // Team owners can override these settings
};

// The result of a cancellation request
export interface CancellationResult {
  success: boolean;
  message: string;
  refundAmount?: number;
  status?: string;
}

/**
 * Calculate refund amount based on team's cancellation policy
 * @param bookingCost Original cost of the booking in credits
 * @param hoursBeforeMatch Hours remaining before the match
 * @param policy The cancellation policy to apply
 */
export function calculateRefundAmount(
  bookingCost: number,
  hoursBeforeMatch: number,
  policy: CancellationPolicy = DEFAULT_CANCELLATION_POLICY
): number {
  // If cancelling before the early refund deadline, give full refund percentage
  if (hoursBeforeMatch >= policy.refundDeadlineHours) {
    return Math.round((policy.earlyRefundPercent / 100) * bookingCost);
  }
  
  // Otherwise, give standard refund percentage
  return Math.round((policy.refundPercent / 100) * bookingCost);
}

/**
 * Check if a user can cancel a booking based on team's cancellation policy
 * @param userId User attempting to cancel
 * @param bookingId Booking to cancel
 * @param reason Reason for cancellation
 */
export async function canCancelBooking(
  userId: number,
  bookingId: number,
  reason?: string
): Promise<CancellationResult> {
  try {
    // Get the booking
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      return { 
        success: false, 
        message: "Booking not found" 
      };
    }
    
    // Get the player booking
    const playerBookings = await storage.getPlayerBookingsByBooking(bookingId);
    const playerBooking = playerBookings.find(pb => pb.playerId === userId);
    
    if (!playerBooking) {
      return { 
        success: false, 
        message: "You are not registered for this match" 
      };
    }
    
    // Calculate hours before match
    const now = new Date();
    const matchTime = new Date(booking.startTime);
    const hoursBeforeMatch = (matchTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Get the team's cancellation policy
    const team = await storage.getTeam(booking.teamId);
    if (!team) {
      return { 
        success: false, 
        message: "Team not found" 
      };
    }
    
    // Use team's policy if it exists, otherwise use default
    const policy = team.cancellationPolicy as CancellationPolicy || DEFAULT_CANCELLATION_POLICY;
    
    // Check if it's too late to cancel
    if (hoursBeforeMatch < policy.minHoursBeforeForCancellation) {
      return {
        success: false,
        message: `Cancellations must be made at least ${policy.minHoursBeforeForCancellation} hours before the match`
      };
    }
    
    // Check if user has exceeded monthly cancellation limit
    // Get all player bookings for the current month that were canceled by this user
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const playerBookingsThisMonth = await storage.getPlayerBookingsByPlayer(userId);
    const canceledBookingsThisMonth = playerBookingsThisMonth.filter(pb => {
      if (pb.status !== 'canceled') return false;
      
      const cancelDate = pb.canceledAt ? new Date(pb.canceledAt) : null;
      return cancelDate && 
        cancelDate.getMonth() === currentMonth && 
        cancelDate.getFullYear() === currentYear;
    });
    
    if (canceledBookingsThisMonth.length >= policy.maxCancellationsPerMonth) {
      return {
        success: false,
        message: `You have reached your limit of ${policy.maxCancellationsPerMonth} cancellations this month`
      };
    }
    
    // Calculate refund amount
    const bookingCost = booking.creditCost || 0;
    const refundAmount = calculateRefundAmount(bookingCost, hoursBeforeMatch, policy);
    
    return {
      success: true,
      message: "Cancellation approved",
      refundAmount,
      status: "approved"
    };
  } catch (error) {
    console.error("Error checking cancellation eligibility:", error);
    return {
      success: false,
      message: "An error occurred checking cancellation eligibility"
    };
  }
}

/**
 * Process a booking cancellation request
 * @param userId User attempting to cancel
 * @param bookingId Booking to cancel
 * @param reason Reason for cancellation
 */
export async function processCancellation(
  userId: number,
  bookingId: number,
  reason?: string
): Promise<CancellationResult> {
  try {
    // First check if the cancellation is valid
    const canCancel = await canCancelBooking(userId, bookingId, reason);
    if (!canCancel.success) {
      return canCancel;
    }
    
    // Get the booking
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      return { 
        success: false, 
        message: "Booking not found" 
      };
    }
    
    // Get the player booking
    const playerBookings = await storage.getPlayerBookingsByBooking(bookingId);
    const playerBooking = playerBookings.find(pb => pb.playerId === userId);
    
    if (!playerBooking) {
      return { 
        success: false, 
        message: "You are not registered for this match" 
      };
    }
    
    // Update player booking status to canceled
    await storage.updatePlayerBooking(playerBooking.id, {
      status: "canceled",
      cancellationReason: reason || "User canceled",
      refundAmount: canCancel.refundAmount || null,
      canceledAt: new Date()
    });
    
    // Process refund if applicable
    if (canCancel.refundAmount && canCancel.refundAmount > 0) {
      await storage.addUserCredits(
        userId,
        canCancel.refundAmount,
        "refund",
        `Refund for canceling booking #${bookingId}: ${reason || "User canceled"}`
      );
    }
    
    // Update available slots in the booking
    await storage.updateBooking(bookingId, {
      availableSlots: booking.availableSlots + 1
    });
    
    // Notify other players if needed (e.g., if this was the organizer)
    // This would depend on your app's requirements
    
    return {
      success: true,
      message: canCancel.refundAmount && canCancel.refundAmount > 0
        ? `Cancellation successful. ${canCancel.refundAmount} credits have been refunded.`
        : "Cancellation successful. No refund was issued.",
      refundAmount: canCancel.refundAmount,
      status: "completed"
    };
  } catch (error) {
    console.error("Error processing cancellation:", error);
    return {
      success: false,
      message: "An error occurred processing your cancellation"
    };
  }
}

/**
 * Cancel an entire booking/match (typically by team owner)
 * @param userId User attempting to cancel (should be team owner or admin)
 * @param bookingId Booking to cancel
 * @param reason Reason for cancellation
 */
export async function cancelEntireBooking(
  userId: number,
  bookingId: number,
  reason: string
): Promise<CancellationResult> {
  try {
    // Get the booking
    const booking = await storage.getBooking(bookingId);
    if (!booking) {
      return { 
        success: false, 
        message: "Booking not found" 
      };
    }
    
    // Get the team
    const team = await storage.getTeam(booking.teamId);
    if (!team) {
      return { 
        success: false, 
        message: "Team not found" 
      };
    }
    
    // Check if user is authorized (team owner or admin)
    const user = await storage.getUser(userId);
    if (!user) {
      return { 
        success: false, 
        message: "User not found" 
      };
    }
    
    const isTeamOwner = team.ownerId === userId;
    const isAdmin = user.role === "admin";
    
    if (!isTeamOwner && !isAdmin) {
      return {
        success: false,
        message: "Only team owners or administrators can cancel entire bookings"
      };
    }
    
    // Get all player bookings for this match
    const playerBookings = await storage.getPlayerBookingsByBooking(bookingId);
    
    // Process refunds for all players
    // Use team's policy if it exists, otherwise use default
    const policy = team.cancellationPolicy as CancellationPolicy || DEFAULT_CANCELLATION_POLICY;
    
    // Calculate hours before match for refund calculation
    const now = new Date();
    const matchTime = new Date(booking.startTime);
    const hoursBeforeMatch = (matchTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    // Refund all players (full refund for team owner cancellation)
    for (const pb of playerBookings) {
      // Skip if already canceled
      if (pb.status === "canceled") continue;
      
      const bookingCost = booking.creditCost || 0;
      // For team owner cancellations, always issue full refund
      const refundAmount = bookingCost;
      
      // Update player booking status
      await storage.updatePlayerBooking(pb.id, {
        status: "canceled",
        cancellationReason: `Team owner canceled: ${reason}`,
        refundAmount: refundAmount,
        canceledAt: new Date()
      });
      
      // Process refund
      if (refundAmount > 0) {
        await storage.addUserCredits(
          pb.playerId,
          refundAmount,
          "refund",
          `Refund for match cancellation by team owner: ${reason}`
        );
      }
    }
    
    // Mark booking as canceled
    await storage.updateBooking(bookingId, {
      status: "canceled",
      cancelReason: reason
    });
    
    // Send notifications to all affected players
    await sendMatchCanceledNotification(bookingId);
    
    return {
      success: true,
      message: "Booking successfully canceled and all players refunded",
      status: "completed"
    };
  } catch (error) {
    console.error("Error canceling entire booking:", error);
    return {
      success: false,
      message: "An error occurred canceling the booking"
    };
  }
}