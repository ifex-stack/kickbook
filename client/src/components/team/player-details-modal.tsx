import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { getInitials } from "@/lib/utils";

interface PlayerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: number | null;
  onEdit: () => void;
}

export function PlayerDetailsModal({ isOpen, onClose, playerId, onEdit }: PlayerDetailsModalProps) {
  const { data: playerData, isLoading } = useQuery({
    queryKey: [`/api/players/${playerId}/stats`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: isOpen && !!playerId,
  });

  if (!playerId) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-medium text-gray-900 dark:text-gray-100">Player Details</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
          </div>
        ) : playerData ? (
          <div className="space-y-4">
            {/* Player info header */}
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:text-primary-light flex items-center justify-center mr-4 text-xl font-semibold">
                {getInitials(playerData.player.name)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{playerData.player.name}</h3>
                <p className="text-gray-500 dark:text-gray-400">{playerData.player.email}</p>
                <div className="mt-1 flex items-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    playerData.player.role === "admin" 
                      ? "bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:text-primary-light"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                  }`}>
                    {playerData.player.role === "admin" ? "Team Admin" : "Player"}
                  </span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Performance stats */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Performance Summary</h4>
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Matches</p>
                  <p className="text-xl font-semibold stats-value">{playerData.summary.totalMatches}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Goals</p>
                  <p className="text-xl font-semibold stats-value">{playerData.summary.totalGoals}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Assists</p>
                  <p className="text-xl font-semibold stats-value">{playerData.summary.totalAssists}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cards</p>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      <span className="material-icons text-sm mr-1">rectangle</span>
                      {playerData.summary.totalYellowCards}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                      <span className="material-icons text-sm mr-1">rectangle</span>
                      {playerData.summary.totalRedCards}
                    </span>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* Recent matches */}
            {playerData.stats.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Recent Matches</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {playerData.stats.slice(0, 3).map((match: any) => (
                    <Card key={match.id} className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {new Date(match.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Goals: {match.goals} • Assists: {match.assists}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {match.yellowCards > 0 && (
                            <span className="inline-flex items-center p-1 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                              <span className="material-icons text-sm">rectangle</span>
                            </span>
                          )}
                          {match.redCards > 0 && (
                            <span className="inline-flex items-center p-1 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                              <span className="material-icons text-sm">rectangle</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button type="button" onClick={onEdit}>
                Edit Player
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">Unable to load player details</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
