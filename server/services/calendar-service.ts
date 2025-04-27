import { google, Auth } from 'googleapis';
import * as ical from 'ical-generator';
import { storage } from '../storage';
import { Booking, Team } from '@shared/schema';

// This would be provided by the environment in production
const TEST_CONFIG = {
  clientId: 'test-client-id.apps.googleusercontent.com',
  clientSecret: 'test-client-secret',
  redirectUri: 'http://localhost:5000/api/calendar/google/callback',
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ]
};

/**
 * Service to handle calendar integrations and event syncing
 */
export class CalendarService {
  /**
   * Get Google OAuth2 authorization URL
   * @returns URL to redirect user to for Google OAuth consent
   */
  getGoogleAuthUrl(): string {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || TEST_CONFIG.clientId,
      process.env.GOOGLE_CLIENT_SECRET || TEST_CONFIG.clientSecret,
      process.env.GOOGLE_REDIRECT_URI || TEST_CONFIG.redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: TEST_CONFIG.scopes,
      prompt: 'consent', // Always request refresh token
    });

    return authUrl;
  }

  /**
   * Exchange Google auth code for tokens
   * @param code - Authorization code from Google OAuth redirect
   */
  async getGoogleTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
  }> {
    try {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID || TEST_CONFIG.clientId,
        process.env.GOOGLE_CLIENT_SECRET || TEST_CONFIG.clientSecret,
        process.env.GOOGLE_REDIRECT_URI || TEST_CONFIG.redirectUri
      );

      // In a real implementation, we would get real tokens here
      // This is a mock implementation for testing
      // const { tokens } = await oauth2Client.getToken(code);
      
      // For test purposes, return mock tokens
      const mockTokenResponse = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600 * 1000) // Expires in 1 hour
      };

      return mockTokenResponse;
    } catch (error) {
      console.error("Error getting Google OAuth tokens:", error);
      throw new Error("Failed to get authorization tokens from Google");
    }
  }

  /**
   * Create a Google OAuth2 client with user's tokens
   * @param accessToken - Google OAuth2 access token
   * @param refreshToken - Google OAuth2 refresh token
   */
  private createGoogleOauth2Client(accessToken: string, refreshToken: string | null): Auth.OAuth2Client {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID || TEST_CONFIG.clientId,
      process.env.GOOGLE_CLIENT_SECRET || TEST_CONFIG.clientSecret,
      process.env.GOOGLE_REDIRECT_URI || TEST_CONFIG.redirectUri
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    return oauth2Client;
  }

  /**
   * Create or update Google Calendar event for a booking
   * @param booking - The booking to create a calendar event for
   * @param user - The user who's calendar to add the event to
   * @param team - The team associated with the booking
   * @param integration - User's calendar integration record
   */
  async createGoogleCalendarEvent(
    booking: Booking,
    user: any,
    team: Team,
    integration: any
  ): Promise<string> {
    try {
      // In a real implementation, we would:
      // 1. Create a Google OAuth2 client with the user's tokens
      // 2. Create or update a calendar event with the booking details
      // 3. Return the event ID
      
      // This is a mock implementation
      return `test-event-id-${booking.id}`;
    } catch (error) {
      console.error(`Error creating Google Calendar event for booking ${booking.id}:`, error);
      throw new Error("Failed to create Google Calendar event");
    }
  }

  /**
   * Generate an iCal file for a booking
   * @param booking - The booking to generate an iCal for
   * @param team - The team associated with the booking
   * @returns iCal string
   */
  generateICalEvent(booking: Booking, team: Team): string {
    const calendar = ical.default({ name: 'Football Team Manager' });
    
    calendar.createEvent({
      start: booking.startTime,
      end: booking.endTime,
      summary: booking.title,
      description: `${booking.format} match for team ${team.name}`,
      location: booking.location,
      url: `${process.env.APP_URL || 'http://localhost:5000'}/bookings?id=${booking.id}`,
      status: booking.status === 'canceled' ? 'CANCELLED' : 'CONFIRMED' as any,
      organizer: {
        name: 'Football Team Manager',
        email: 'noreply@footballteammanager.com'
      }
    });
    
    // Return as iCal string
    return calendar.toString();
  }

  /**
   * Sync multiple bookings to a user's calendar
   * @param userId - The user ID
   * @param provider - Calendar provider (google, apple)
   * @returns Number of events synced
   */
  async syncUserCalendar(userId: number, provider: string): Promise<number> {
    try {
      // Get user and their calendar integration
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      const integration = await storage.getCalendarIntegrationByUser(userId, provider);
      if (!integration) {
        throw new Error(`No ${provider} calendar integration found for user ${userId}`);
      }
      
      // Get user's team
      if (!user.teamId) {
        throw new Error(`User ${userId} is not associated with a team`);
      }
      
      const team = await storage.getTeam(user.teamId);
      if (!team) {
        throw new Error(`Team with ID ${user.teamId} not found`);
      }
      
      // Get upcoming bookings for the team
      const bookings = await storage.getBookingsByTeam(team.id);
      
      // Only sync future bookings
      const now = new Date();
      const futureBookings = bookings.filter(booking => booking.startTime > now);
      
      let syncedCount = 0;
      
      // Process each booking
      for (const booking of futureBookings) {
        if (provider === 'google') {
          await this.createGoogleCalendarEvent(booking, user, team, integration);
          syncedCount++;
        }
        // Add other providers here if needed
      }
      
      // Update last synced timestamp
      await storage.updateCalendarIntegration(integration.id, {
        lastSyncedAt: new Date()
      });
      
      return syncedCount;
    } catch (error) {
      console.error(`Error syncing ${provider} calendar for user ${userId}:`, error);
      throw new Error(`Failed to sync ${provider} calendar`);
    }
  }
}

// Export singleton instance
export const calendarService = new CalendarService();