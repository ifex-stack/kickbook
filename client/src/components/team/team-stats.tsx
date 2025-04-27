import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 shadow p-5 custom-shadow">
      <div className="flex items-center">
        <div className={`p-3 rounded-full bg-${color}-DEFAULT bg-opacity-10 text-${color}-DEFAULT dark:text-${color}-light`}>
          <span className="material-icons">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-lg font-semibold stats-value">{value}</p>
        </div>
      </div>
    </Card>
  );
}

interface TeamStatsProps {
  totalPlayers: number;
  upcomingMatches: number;
  seasonWins: number;
  totalGoals: number;
}

export function TeamStats({ totalPlayers, upcomingMatches, seasonWins, totalGoals }: TeamStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title="Total Players"
        value={totalPlayers}
        icon="groups"
        color="primary"
      />
      <StatCard
        title="Upcoming Matches"
        value={upcomingMatches}
        icon="event_available"
        color="accent"
      />
      <StatCard
        title="Season Wins"
        value={seasonWins}
        icon="emoji_events"
        color="secondary"
      />
      <StatCard
        title="Total Goals"
        value={totalGoals}
        icon="sports_score"
        color="success"
      />
    </div>
  );
}
