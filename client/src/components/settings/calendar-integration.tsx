import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { SiApple } from "react-icons/si";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2, RefreshCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface CalendarIntegrationStatus {
  google: {
    connected: boolean;
    isActive?: boolean;
    lastSynced?: Date | null;
  };
  // Support for other providers like Apple Calendar can be added here
}

interface CalendarIntegrationProps {
  userId: number;
}

export function CalendarIntegration({ userId }: CalendarIntegrationProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch calendar integrations
  const { data: integrations, isLoading } = useQuery({
    queryKey: ['/api/calendar/integrations'],
    enabled: !!userId
  });

  // Sync calendars mutation
  const syncMutation = useMutation({
    mutationFn: (provider: string) => {
      return apiRequest("POST", "/api/calendar/sync", { provider });
    },
    onSuccess: (data) => {
      toast({
        title: "Calendar Synced",
        description: data.message || "Your calendar has been synced successfully",
      });
      // Refetch integration data
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/integrations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync your calendar. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Disconnect calendar mutation
  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => {
      return apiRequest("DELETE", `/api/calendar/integrations/${provider}`);
    },
    onSuccess: (data) => {
      toast({
        title: "Calendar Disconnected",
        description: data.message || "Your calendar has been disconnected",
      });
      // Refetch integration data
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/integrations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Disconnect",
        description: error.message || "Failed to disconnect your calendar",
        variant: "destructive",
      });
    }
  });

  const handleConnect = async (provider: string) => {
    try {
      setIsConnecting(true);
      // Get auth URL from backend
      const response = await apiRequest("GET", `/api/calendar/auth/${provider}`);
      
      // Open the auth URL in a new window
      window.location.href = response.authUrl;
    } catch (error: any) {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to calendar service",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = (provider: string) => {
    syncMutation.mutate(provider);
  };

  const handleDisconnect = (provider: string) => {
    disconnectMutation.mutate(provider);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Calendar Integrations</h3>
      <p className="text-sm text-muted-foreground">
        Connect your calendar to automatically sync your team's matches and training sessions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Calendar Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <FcGoogle className="h-6 w-6" />
              <CardTitle className="text-md font-medium">Google Calendar</CardTitle>
            </div>
            {integrations?.google?.connected && integrations?.google?.isActive && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Connected
              </Badge>
            )}
            {integrations?.google?.connected && !integrations?.google?.isActive && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Inactive
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <CardDescription className="pt-2">
              Sync your matches and training sessions with your Google Calendar.
            </CardDescription>
            
            {integrations?.google?.connected && integrations?.google?.isActive && integrations?.google?.lastSynced && (
              <p className="text-xs text-muted-foreground mt-2">
                Last synced: {format(new Date(integrations.google.lastSynced), "PPp")}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {!integrations?.google?.connected ? (
              <Button 
                onClick={() => handleConnect('google')} 
                disabled={isConnecting} 
                className="w-full"
              >
                {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Connect Google Calendar
              </Button>
            ) : (
              <div className="flex space-x-2 w-full">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => handleSync('google')}
                        disabled={syncMutation.isPending || !integrations.google.isActive}
                      >
                        {syncMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sync calendar</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Button 
                  variant="default" 
                  className="flex-1"
                  disabled={!integrations.google.isActive}
                  onClick={() => handleSync('google')}
                >
                  {syncMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Sync Now
                </Button>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="text-destructive"
                        onClick={() => handleDisconnect('google')}
                        disabled={disconnectMutation.isPending}
                      >
                        {disconnectMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Disconnect</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Apple Calendar Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              <SiApple className="h-5 w-5" />
              <CardTitle className="text-md font-medium">Apple Calendar</CardTitle>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              iCal Download
            </Badge>
          </CardHeader>
          <CardContent>
            <CardDescription className="pt-2">
              Download .ics files for each booking to import into Apple Calendar manually.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                toast({
                  title: "iCal Download",
                  description: "Download .ics files from the bookings page for each match.",
                });
              }}
            >
              Learn More
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}