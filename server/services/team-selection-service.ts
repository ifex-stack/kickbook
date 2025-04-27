import { User, Booking, PlayerStats, Team } from '@shared/schema';
import { storage } from '../storage';
import { whatsappService } from './whatsapp-service';

interface PlayerWithStats extends User {
  stats?: {
    totalGoals: number;
    totalAssists: number;
    gamesPlayed: number;
    averageRating: number;
    preferredPosition?: string;
  };
}

/**
 * Service to handle automatic team selection for matches
 */
export class TeamSelectionService {
  /**
   * Generate balanced teams for a booking
   * @param bookingId - The booking to generate teams for
   * @returns Object with Team A and Team B arrays of players
   */
  async generateBalancedTeams(bookingId: number): Promise<{ teamA: User[], teamB: User[] }> {
    try {
      // Get the booking
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        throw new Error(`Booking with ID ${bookingId} not found`);
      }

      // Get the team
      const team = await storage.getTeam(booking.teamId);
      if (!team) {
        throw new Error(`Team with ID ${booking.teamId} not found`);
      }
      
      // Get all players registered for this booking
      const playerBookings = await storage.getPlayerBookingsByBooking(bookingId);
      if (!playerBookings.length) {
        throw new Error('No players registered for this booking');
      }
      
      // Get player details with their stats
      const playersWithStats: PlayerWithStats[] = [];
      
      for (const pb of playerBookings) {
        const player = await storage.getUser(pb.playerId);
        if (player) {
          // Get player's stats from previous matches
          const playerStats = await storage.getPlayerStatsByPlayer(player.id);
          
          const stats = {
            totalGoals: 0,
            totalAssists: 0,
            gamesPlayed: playerStats.length,
            averageRating: 0,
            preferredPosition: 'unspecified' // In a real app, we would store this in user preferences
          };
          
          // Calculate totals and averages
          playerStats.forEach(stat => {
            if (stat.goals) stats.totalGoals += stat.goals;
            if (stat.assists) stats.totalAssists += stat.assists;
          });
          
          playersWithStats.push({
            ...player,
            stats
          });
        }
      }
      
      // Sort players by skill level (basic algorithm using goals + assists)
      playersWithStats.sort((a, b) => {
        const aScore = (a.stats?.totalGoals || 0) + (a.stats?.totalAssists || 0);
        const bScore = (b.stats?.totalGoals || 0) + (b.stats?.totalAssists || 0);
        return bScore - aScore; // Descending order
      });
      
      // Determine team sizes based on booking format
      let playersPerTeam = 5; // Default for 5-a-side
      
      if (booking.format.includes('7')) {
        playersPerTeam = 7;
      } else if (booking.format.includes('11')) {
        playersPerTeam = 11;
      }
      
      // Make sure we have enough players
      if (playersWithStats.length < playersPerTeam * 2) {
        // Not enough players for a full match, adjust team size
        playersPerTeam = Math.floor(playersWithStats.length / 2);
      }
      
      // Create balanced teams using alternating selection (snake draft)
      const teamA: User[] = [];
      const teamB: User[] = [];
      
      // Limit to players we need based on format
      const requiredPlayers = playersPerTeam * 2;
      const availablePlayers = playersWithStats.slice(0, requiredPlayers);
      
      // Distribute players using snake draft to create balanced teams
      availablePlayers.forEach((player, index) => {
        // Snake draft: 0,3,4,7,8... to Team A and 1,2,5,6,9... to Team B
        if (index % 4 === 0 || index % 4 === 3) {
          teamA.push(player);
        } else {
          teamB.push(player);
        }
      });
      
      // Notify team members about the selection via WhatsApp
      await whatsappService.sendTeamSelectionNotification(booking, team, teamA, teamB);
      
      return { teamA, teamB };
    } catch (error) {
      console.error('Error generating balanced teams:', error);
      throw error;
    }
  }
  
  /**
   * Create position-based teams (more advanced algorithm)
   * In a real app, this would use player positions and create proper formations
   */
  async generatePositionBasedTeams(bookingId: number): Promise<{ teamA: User[], teamB: User[] }> {
    // For now, this is a placeholder that just uses the balanced team algorithm
    // In a complete implementation, this would properly assign players to positions
    return this.generateBalancedTeams(bookingId);
  }
}

export const teamSelectionService = new TeamSelectionService();