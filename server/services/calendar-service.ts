import { google, calendar_v3 } from 'googleapis';
import ical from 'ical-generator';
import { storage } from '../storage';
import { Booking, User, Team, CalendarIntegration } from '@shared/schema';
import { OAuth2Client } from 'google-auth-library';

/**
 * CalendarService - Handles calendar integrations with various providers
 * Currently supports Google Calendar (using googleapis)
 * and Apple Calendar (via iCal generation)
 */
export class CalendarService {
  // Singleton instance
  private static instance: CalendarService;

  constructor() {
    if (CalendarService.instance) {
      return CalendarService.instance;
    }
    CalendarService.instance = this;
  }

  /**
   * Get or create a calendar service instance
   */
  static getInstance(): CalendarService {
    if (!CalendarService.instance) {
      CalendarService.instance = new CalendarService();
    }
    return CalendarService.instance;
  }

  /**
   * Initialize the Google OAuth2 client
   * @param clientId - Google OAuth Client ID
   * @param clientSecret - Google OAuth Client Secret
   * @returns OAuth2 client
   */
  private getGoogleOAuth2Client(
    clientId?: string,
    clientSecret?: string
  ): OAuth2Client {
    const client = new google.auth.OAuth2(
      clientId || process.env.GOOGLE_CLIENT_ID,
      clientSecret || process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.APP_URL || 'http://localhost:5000'}/api/calendar/google/callback`
    );
    return client;
  }

  /**
   * Generate a Google OAuth2 authorization URL
   * @returns URL for user to authorize the app
   */
  getGoogleAuthUrl(): string {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }
    
    const oauth2Client = this.getGoogleOAuth2Client();
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];
    
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent' // Force to get refresh token every time
    });
  }

  /**
   * Get Google OAuth2 tokens from authorization code
   * @param code - Authorization code from Google OAuth flow
   * @returns Access & refresh tokens with expiry details
   */
  async getGoogleTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string | null;
    expiresAt: Date;
  }> {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }
    
    const oauth2Client = this.getGoogleOAuth2Client();
    
    try {
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }
      
      // Calculate expiration date
      const expiresIn = tokens.expiry_date ? 
        tokens.expiry_date - Date.now() : 
        3600 * 1000; // Default to 1 hour
      
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + expiresIn);
      
      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt
      };
    } catch (error) {
      console.error('Error exchanging Google auth code for tokens:', error);
      throw new Error('Failed to get Google OAuth tokens');
    }
  }

  /**
   * Refresh Google access token using refresh token
   * @param refreshToken - Google OAuth refresh token
   * @returns New access token and expiry
   */
  async refreshGoogleAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: Date;
  }> {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }
    
    const oauth2Client = this.getGoogleOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('No access token received from Google');
      }
      
      // Calculate expiration date
      const expiresIn = credentials.expiry_date ? 
        credentials.expiry_date - Date.now() : 
        3600 * 1000; // Default to 1 hour
      
      const expiresAt = new Date();
      expiresAt.setTime(expiresAt.getTime() + expiresIn);
      
      return {
        accessToken: credentials.access_token,
        expiresAt
      };
    } catch (error) {
      console.error('Error refreshing Google access token:', error);
      throw new Error('Failed to refresh Google access token');
    }
  }

  /**
   * Get a configured Google Calendar API client with valid access token
   * @param integration - Calendar integration record
   * @returns Google Calendar API client
   */
  async getGoogleCalendarClient(integration: CalendarIntegration): Promise<calendar_v3.Calendar> {
    // Check if token is expired and refresh if needed
    const now = new Date();
    let accessToken = integration.accessToken;
    
    if (!accessToken) {
      throw new Error('No access token found for this integration');
    }
    
    // Refresh token if it's expired or about to expire (within 5 minutes)
    if (integration.expiresAt && integration.expiresAt < new Date(now.getTime() + 5 * 60 * 1000)) {
      if (!integration.refreshToken) {
        throw new Error('Refresh token not available to renew expired access token');
      }
      
      const { accessToken: newToken, expiresAt } = await this.refreshGoogleAccessToken(integration.refreshToken);
      
      // Update the integration record with new token
      await storage.updateCalendarIntegration(integration.id, {
        accessToken: newToken,
        expiresAt
      });
      
      accessToken = newToken;
    }
    
    // Initialize OAuth client with access token
    const oauth2Client = this.getGoogleOAuth2Client();
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: integration.refreshToken
    });
    
    // Return Google Calendar API client
    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  /**
   * Create or retrieve primary calendar for the integration
   * @param integration - Calendar integration record
   * @returns Calendar ID
   */
  async getOrCreateGoogleCalendar(integration: CalendarIntegration): Promise<string> {
    // If we already have a calendar ID, return it
    if (integration.calendarId) {
      return integration.calendarId;
    }
    
    try {
      const calendarClient = await this.getGoogleCalendarClient(integration);
      
      // Create a new calendar for the app
      const calendar = await calendarClient.calendars.insert({
        requestBody: {
          summary: 'Football Team Manager',
          description: 'Calendar for football matches and training sessions'
        }
      });
      
      if (!calendar.data.id) {
        throw new Error('Failed to create Google Calendar');
      }
      
      // Update the integration with the new calendar ID
      await storage.updateCalendarIntegration(integration.id, {
        calendarId: calendar.data.id
      });
      
      return calendar.data.id;
    } catch (error) {
      console.error('Error creating Google Calendar:', error);
      throw new Error('Failed to create Google Calendar');
    }
  }

  /**
   * Create a calendar event for a booking
   * @param booking - The booking to create an event for
   * @param user - The user who owns the calendar
   * @param team - The team associated with the booking
   * @param integration - Calendar integration record
   * @returns Event ID if successful
   */
  async createGoogleCalendarEvent(
    booking: Booking,
    user: User,
    team: Team,
    integration: CalendarIntegration
  ): Promise<string> {
    try {
      const calendarClient = await this.getGoogleCalendarClient(integration);
      
      // Get or create calendar if needed
      const calendarId = await this.getOrCreateGoogleCalendar(integration);
      
      // Format event details
      const event = {
        summary: booking.title,
        location: booking.location,
        description: `${booking.format} match for team ${team.name}`,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: 'Europe/London' // TODO: Make this configurable or detect from user settings
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: 'Europe/London'
        },
        attendees: [
          { email: user.email }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 } // 1 hour before
          ]
        },
        colorId: booking.format === '5-a-side' ? '1' : 
                 booking.format === '7-a-side' ? '2' : '3', // Different colors for different formats
        // Add custom metadata
        extendedProperties: {
          private: {
            bookingId: booking.id.toString(),
            teamId: team.id.toString(),
            format: booking.format,
            application: 'football-team-manager'
          }
        }
      };
      
      // Create the event
      const response = await calendarClient.events.insert({
        calendarId,
        requestBody: event
      });
      
      if (!response.data.id) {
        throw new Error('Failed to create calendar event');
      }
      
      return response.data.id;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw new Error('Failed to create calendar event');
    }
  }

  /**
   * Update an existing calendar event
   * @param booking - The updated booking
   * @param eventId - The Google Calendar event ID
   * @param integration - Calendar integration record
   * @returns True if successful
   */
  async updateGoogleCalendarEvent(
    booking: Booking,
    eventId: string,
    integration: CalendarIntegration
  ): Promise<boolean> {
    try {
      const calendarClient = await this.getGoogleCalendarClient(integration);
      const calendarId = integration.calendarId;
      
      if (!calendarId) {
        throw new Error('No calendar ID found for this integration');
      }
      
      // Get the existing event
      const existingEvent = await calendarClient.events.get({
        calendarId,
        eventId
      });
      
      // Update event details
      const updatedEvent = {
        ...existingEvent.data,
        summary: booking.title,
        location: booking.location,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: 'Europe/London'
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: 'Europe/London'
        },
        status: booking.status === 'canceled' ? 'cancelled' : 'confirmed'
      };
      
      // Update the event
      await calendarClient.events.update({
        calendarId,
        eventId,
        requestBody: updatedEvent
      });
      
      return true;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      return false;
    }
  }

  /**
   * Cancel (delete) a calendar event
   * @param eventId - The Google Calendar event ID
   * @param integration - Calendar integration record
   * @returns True if successful
   */
  async cancelGoogleCalendarEvent(
    eventId: string,
    integration: CalendarIntegration
  ): Promise<boolean> {
    try {
      const calendarClient = await this.getGoogleCalendarClient(integration);
      const calendarId = integration.calendarId;
      
      if (!calendarId) {
        throw new Error('No calendar ID found for this integration');
      }
      
      // Delete the event
      await calendarClient.events.delete({
        calendarId,
        eventId
      });
      
      return true;
    } catch (error) {
      console.error('Error canceling Google Calendar event:', error);
      return false;
    }
  }

  /**
   * Generate an iCal file for Apple Calendar
   * @param booking - The booking to generate iCal for
   * @param team - The team associated with the booking
   * @returns iCal file as string
   */
  generateICalEvent(booking: Booking, team: Team): string {
    // Create a new calendar
    const calendar = ical({
      name: 'Football Team Manager',
      timezone: 'Europe/London'
    });
    
    // Add an event
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