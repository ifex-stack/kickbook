import axios from 'axios';
import { storage } from '../storage';
import { PlayerBooking, User, Team, Booking } from '@shared/schema';

// Test configuration for WhatsApp Business API
const TEST_CONFIG = {
  apiKey: 'test-whatsapp-api-key',
  businessAccountId: 'test-business-account-id',
  baseUrl: 'https://graph.facebook.com/v16.0',
  phoneNumberId: 'test-phone-number-id',
};

interface WhatsAppMessageTemplate {
  name: string;
  language: {
    code: string;
  };
  components?: Array<{
    type: string;
    parameters: Array<{
      type: string;
      text?: string;
      currency?: {
        code: string;
        amount_1000: number;
      };
      date_time?: {
        fallback_value: string;
      };
    }>;
  }>;
}

/**
 * WhatsApp service to handle sending messages to individual players and groups
 */
export class WhatsAppService {
  private apiKey: string;
  private businessAccountId: string;
  private baseUrl: string;
  private phoneNumberId: string;

  constructor() {
    this.apiKey = process.env.WHATSAPP_API_KEY || TEST_CONFIG.apiKey;
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || TEST_CONFIG.businessAccountId;
    this.baseUrl = TEST_CONFIG.baseUrl;
    this.phoneNumberId = TEST_CONFIG.phoneNumberId;
  }

  /**
   * Send a WhatsApp message using a template
   * @param to - Recipient's phone number with country code (e.g. 447123456789)
   * @param template - Message template configuration
   * @returns Success status
   */
  async sendTemplateMessage(to: string, template: WhatsAppMessageTemplate): Promise<boolean> {
    try {
      // In a real implementation, we would make an actual API call
      console.log(`[WHATSAPP TEST] Sending template message to ${to}`);
      console.log(`[WHATSAPP TEST] Template: ${JSON.stringify(template)}`);
      
      // Mock successful API response for testing
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Send a simple text message
   * @param to - Recipient's phone number with country code
   * @param text - Message text
   * @returns Success status
   */
  async sendTextMessage(to: string, text: string): Promise<boolean> {
    try {
      // In a real implementation, we would make an actual API call
      console.log(`[WHATSAPP TEST] Sending text message to ${to}: ${text}`);
      
      // Mock successful API response for testing
      return true;
    } catch (error) {
      console.error('Error sending WhatsApp text message:', error);
      return false;
    }
  }

  /**
   * Notify team about a new booking
   * @param booking - The booking that was made
   * @param player - The player who made the booking
   * @param team - The team associated with the booking
   * @returns Success status
   */
  async notifyTeamAboutBooking(booking: Booking, player: User, team: Team): Promise<boolean> {
    try {
      // Get team owner phone number
      const teamOwner = await storage.getUser(team.ownerId);
      if (!teamOwner) {
        console.error(`Team owner with ID ${team.ownerId} not found`);
        return false;
      }
      
      // In a real app, the team owner's phone would be stored in the user profile
      // For testing purposes we'll use a placeholder
      const ownerPhone = teamOwner.phone || 'test-phone-number';
      
      // Format the date and time nicely
      const date = new Date(booking.startTime).toLocaleDateString();
      const startTime = new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Create a message template for booking notification
      const template: WhatsAppMessageTemplate = {
        name: 'booking_notification',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: player.name },
              { type: 'text', text: booking.title },
              { type: 'text', text: date },
              { type: 'text', text: `${startTime} - ${endTime}` },
              { type: 'text', text: booking.format },
              { type: 'text', text: team.name }
            ]
          }
        ]
      };
      
      // Send the message
      return this.sendTemplateMessage(ownerPhone, template);
    } catch (error) {
      console.error('Error notifying team about booking:', error);
      return false;
    }
  }

  /**
   * Send team selection notification
   * @param booking - The booking with selected teams
   * @param team - The team associated with the booking
   * @param teamA - Array of players in Team A
   * @param teamB - Array of players in Team B
   * @returns Success status
   */
  async sendTeamSelectionNotification(
    booking: Booking, 
    team: Team,
    teamA: User[],
    teamB: User[]
  ): Promise<boolean> {
    try {
      // Get team owner
      const teamOwner = await storage.getUser(team.ownerId);
      if (!teamOwner) {
        console.error(`Team owner with ID ${team.ownerId} not found`);
        return false;
      }
      
      // In a real app, we would have a team chat ID or group admin phone number
      const ownerPhone = teamOwner.phone || 'test-phone-number';
      
      // Format the date
      const date = new Date(booking.startTime).toLocaleDateString();
      const time = new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Format team lists
      const teamAString = teamA.map(p => p.name).join(', ');
      const teamBString = teamB.map(p => p.name).join(', ');
      
      // For testing, we'll just send a text message
      // In a real implementation, you might use a more structured template
      const message = `🏆 TEAM SELECTION: ${booking.title} - ${date} ${time} (${booking.format})\\n\\n` +
                      `Team A: ${teamAString}\\n\\n` + 
                      `Team B: ${teamBString}\\n\\n` +
                      `Location: ${booking.location}`;
      
      return this.sendTextMessage(ownerPhone, message);
    } catch (error) {
      console.error('Error sending team selection notification:', error);
      return false;
    }
  }
}

export const whatsappService = new WhatsAppService();