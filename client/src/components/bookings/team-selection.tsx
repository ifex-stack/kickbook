import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Booking, User } from '@shared/schema';
import { Loader2, User as UserIcon, RefreshCw, MessageCircle, Share } from 'lucide-react';

interface TeamSelectionProps {
  booking: Booking;
  playersRegistered: User[];
  onTeamsGenerated?: (teamA: User[], teamB: User[]) => void;
}

export function TeamSelection({ booking, playersRegistered, onTeamsGenerated }: TeamSelectionProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isNotifying, setIsNotifying] = useState<boolean>(false);
  const [teamA, setTeamA] = useState<User[]>([]);
  const [teamB, setTeamB] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('balanced');
  const { toast } = useToast();

  const generateTeams = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', `/api/bookings/${booking.id}/generate-teams`);
      const data = await response.json();
      
      if (data.success) {
        setTeamA(data.teamA);
        setTeamB(data.teamB);
        
        if (onTeamsGenerated) {
          onTeamsGenerated(data.teamA, data.teamB);
        }
        
        toast({
          title: 'Teams Generated',
          description: data.message,
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to generate teams',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating teams:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate teams. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const notifyViaWhatsApp = async () => {
    try {
      setIsNotifying(true);
      
      const response = await apiRequest('POST', `/api/bookings/${booking.id}/notify-whatsapp`);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Notification Sent',
          description: 'WhatsApp notification sent successfully to team members',
        });
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to send WhatsApp notification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to send WhatsApp notification. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsNotifying(false);
    }
  };

  const generatePositionBasedTeams = () => {
    // In a real implementation, this would call a different API endpoint
    // For now, we'll use the same balanced teams generation
    generateTeams();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const TeamList = ({ players, team }: { players: User[], team: string }) => {
    if (players.length === 0) {
      return <div className="py-4 text-center text-gray-500">No players selected</div>;
    }

    return (
      <div className="space-y-2">
        {players.map(player => (
          <div key={player.id} className="flex items-center p-2 rounded-md bg-muted/50">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-1 items-center justify-between">
              <span className="text-sm font-medium">{player.name}</span>
              <Badge variant="outline" className="ml-2">
                {team}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const noPlayersMessage = (
    <div className="text-center py-8">
      <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No players registered</h3>
      <p className="mt-1 text-sm text-gray-500">
        Wait for players to register for this match before generating teams.
      </p>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Team Selection</CardTitle>
        <CardDescription>
          Automatically generate balanced teams for {booking.format}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {playersRegistered.length === 0 ? (
          noPlayersMessage
        ) : (
          <>
            <Tabs defaultValue="balanced" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="balanced">Balanced Teams</TabsTrigger>
                <TabsTrigger value="position">Position Based</TabsTrigger>
              </TabsList>
              
              <TabsContent value="balanced" className="mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Generate balanced teams based on player statistics and previous performance.
                </p>
                
                {teamA.length > 0 && teamB.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h3 className="font-semibold mb-2">Team A</h3>
                      <TeamList players={teamA} team="A" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Team B</h3>
                      <TeamList players={teamB} team="B" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Click the button below to generate balanced teams.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="position" className="mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Generate teams based on player positions and preferred roles.
                </p>
                
                {teamA.length > 0 && teamB.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h3 className="font-semibold mb-2">Team A</h3>
                      <TeamList players={teamA} team="A" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Team B</h3>
                      <TeamList players={teamB} team="B" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Click the button below to generate position-based teams.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        <div className="flex w-full space-x-2">
          <Button
            variant="default"
            className="flex-1"
            onClick={activeTab === 'balanced' ? generateTeams : generatePositionBasedTeams}
            disabled={isLoading || playersRegistered.length < 2}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Generate Teams
          </Button>
          
          <Button
            variant="outline"
            className="flex-1"
            onClick={notifyViaWhatsApp}
            disabled={isNotifying || teamA.length === 0 || teamB.length === 0}
          >
            {isNotifying ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageCircle className="mr-2 h-4 w-4" />
            )}
            Notify WhatsApp
          </Button>
        </div>
        
        {teamA.length > 0 && teamB.length > 0 && (
          <div className="w-full">
            <Separator className="my-2" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Created at {new Date().toLocaleTimeString()}</span>
              <Button variant="ghost" size="sm" className="h-8">
                <Share className="h-4 w-4 mr-1" />
                Share
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}