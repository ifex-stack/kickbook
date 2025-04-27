import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PlayerList } from "@/components/team/player-list";
import { AddPlayerModal } from "@/components/team/add-player-modal";
import { PlayerDetailsModal } from "@/components/team/player-details-modal";
import { EditPlayerModal } from "@/components/team/edit-player-modal";
import { TeamStats } from "@/components/team/team-stats";
import { useAuth } from "@/components/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { downloadCSV } from "@/lib/utils";

export default function Team() {
  const { user } = useAuth();
  
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null);
  const [showPlayerDetails, setShowPlayerDetails] = useState(false);
  const [showEditPlayer, setShowEditPlayer] = useState(false);
  
  const { data: teamMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: [`/api/teams/${user?.teamId}/members`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: !!user?.teamId,
  });
  
  const { data: teamStats, isLoading: isLoadingStats } = useQuery({
    queryKey: [`/api/teams/${user?.teamId}/stats`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: !!user?.teamId,
  });
  
  // Transform team members data to match PlayerList component props
  const players = teamMembers ? teamMembers.map((member: any) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    position: member.position || "Forward",
    status: member.status || "active",
    goals: member.stats?.goals || 0,
    assists: member.stats?.assists || 0,
    yellowCards: member.stats?.yellowCards || 0,
    redCards: member.stats?.redCards || 0,
  })) : [];
  
  // Calculate team stats
  const stats = {
    totalPlayers: players.length,
    upcomingMatches: teamStats?.upcomingMatches || 0,
    seasonWins: teamStats?.wins || 0,
    totalGoals: teamStats?.goals || 0,
  };
  
  const handleExportRoster = () => {
    if (!players.length) return;
    
    const exportData = players.map(player => ({
      Name: player.name,
      Email: player.email,
      Position: player.position,
      Status: player.status,
      Goals: player.goals,
      Assists: player.assists,
      "Yellow Cards": player.yellowCards,
      "Red Cards": player.redCards,
    }));
    
    downloadCSV(exportData, `team-roster-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <AppShell user={{ name: user?.name || "User", role: user?.role || "player" }}>
      <PageHeader 
        title="Team Management" 
        description="Manage your team roster and player details"
        actions={
          <>
            {user?.role === "admin" && (
              <Button onClick={() => setShowAddPlayerModal(true)}>
                <span className="material-icons text-sm mr-2">add</span>
                Add Player
              </Button>
            )}
            <Button variant="outline" onClick={handleExportRoster}>
              <span className="material-icons text-sm mr-2">file_download</span>
              Export Roster
            </Button>
          </>
        }
      />
      
      <TeamStats 
        totalPlayers={stats.totalPlayers}
        upcomingMatches={stats.upcomingMatches}
        seasonWins={stats.seasonWins}
        totalGoals={stats.totalGoals}
      />
      
      <PlayerList 
        players={players}
        onViewPlayer={(player) => {
          setSelectedPlayer(player);
          setShowPlayerDetails(true);
        }}
        onEditPlayer={(player) => {
          setSelectedPlayer(player);
          setShowEditPlayer(true);
        }}
      />
      
      {/* Modals */}
      {showAddPlayerModal && (
        <AddPlayerModal 
          isOpen={showAddPlayerModal}
          onClose={() => setShowAddPlayerModal(false)}
          teamId={user?.teamId || 0}
          onSuccess={() => {
            // Refetch team members data
          }}
        />
      )}
      
      {showPlayerDetails && selectedPlayer && (
        <PlayerDetailsModal 
          isOpen={showPlayerDetails}
          onClose={() => {
            setShowPlayerDetails(false);
            setSelectedPlayer(null);
          }}
          playerId={selectedPlayer.id}
          onEdit={() => {
            setShowPlayerDetails(false);
            setShowEditPlayer(true);
          }}
        />
      )}
      
      {showEditPlayer && selectedPlayer && (
        <EditPlayerModal 
          isOpen={showEditPlayer}
          onClose={() => {
            setShowEditPlayer(false);
            setSelectedPlayer(null);
          }}
          playerId={selectedPlayer.id}
          teamId={user?.teamId || 0}
        />
      )}
    </AppShell>
  );
}
