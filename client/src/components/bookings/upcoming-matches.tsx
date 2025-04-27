import { Card } from "@/components/ui/card";
import { formatTimeRange, formatDistanceToNowShort, getInitials } from "@/lib/utils";

interface Match {
  id: number;
  title: string;
  location: string;
  startTime: Date;
  endTime: Date;
  format: string;
  attendees: {
    id: number;
    name: string;
  }[];
}

function getFormatIcon(format: string) {
  switch (format) {
    case "5-a-side":
      return "secondary";
    case "11-a-side":
      return "accent";
    case "7-a-side":
    default:
      return "primary";
  }
}

interface UpcomingMatchProps {
  match: Match;
  onViewDetails: (match: Match) => void;
}

function UpcomingMatch({ match, onViewDetails }: UpcomingMatchProps) {
  const formatColor = getFormatIcon(match.format);
  const timeDistance = formatDistanceToNowShort(match.startTime);
  
  return (
    <div className="p-4 sm:px-6">
      <div className="flex items-start">
        <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-${formatColor}-DEFAULT bg-opacity-10 text-${formatColor}-DEFAULT dark:text-${formatColor}-light`}>
          <span className="material-icons">sports_soccer</span>
        </span>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
              {match.title}
            </h3>
            <span className={`px-2 py-1 text-xs rounded-md bg-${formatColor}-DEFAULT bg-opacity-10 text-${formatColor}-DEFAULT dark:text-${formatColor}-light`}>
              {timeDistance}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{match.location}</p>
          <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span className="material-icons text-sm mr-1">calendar_today</span>
            {formatTimeRange(match.startTime, match.endTime)}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex -space-x-2">
              {match.attendees.slice(0, 3).map(attendee => (
                <div 
                  key={attendee.id}
                  className="w-6 h-6 rounded-full bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:text-primary-light border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs"
                >
                  {getInitials(attendee.name)}
                </div>
              ))}
              {match.attendees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">+{match.attendees.length - 3}</span>
                </div>
              )}
            </div>
            <button 
              className="text-sm text-primary-DEFAULT hover:text-primary-dark dark:text-primary-light dark:hover:text-primary-light font-medium"
              onClick={() => onViewDetails(match)}
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface UpcomingMatchesProps {
  matches: Match[];
  onViewDetails: (match: Match) => void;
  onBookNew: () => void;
}

export function UpcomingMatches({ matches, onViewDetails, onBookNew }: UpcomingMatchesProps) {
  return (
    <Card className="bg-white dark:bg-gray-800 rounded-lg shadow custom-shadow">
      <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6">
        <h2 className="text-lg font-heading font-semibold text-gray-900 dark:text-gray-100">Upcoming Matches</h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {matches.length > 0 ? (
          matches.map(match => (
            <UpcomingMatch 
              key={match.id} 
              match={match} 
              onViewDetails={onViewDetails} 
            />
          ))
        ) : (
          <div className="p-6 text-center">
            <span className="material-icons text-4xl text-gray-400 dark:text-gray-600 mb-2">event_busy</span>
            <p className="text-gray-500 dark:text-gray-400">No upcoming matches</p>
          </div>
        )}
      </div>
      <div className="p-4 sm:px-6 border-t border-gray-200 dark:border-gray-700">
        <button 
          className="w-full flex items-center justify-center py-2 px-4 border border-primary-DEFAULT rounded-md shadow-sm text-sm font-medium text-primary-DEFAULT hover:bg-primary-DEFAULT hover:text-white transition-colors"
          onClick={onBookNew}
        >
          <span className="material-icons text-sm mr-2">add</span>
          Book New Session
        </button>
      </div>
    </Card>
  );
}
