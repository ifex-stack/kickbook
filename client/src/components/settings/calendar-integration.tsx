import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FcGoogle } from "react-icons/fc";
import { SiApple } from "react-icons/si";

interface CalendarIntegrationProps {
  userId: number;
}

export function CalendarIntegration({ userId }: CalendarIntegrationProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch current calendar integrations
  const { data: integrations, isLoading: isLoadingIntegrations, refetch } = useQuery({
    queryKey: ['/api/calendar/integrations'],
    queryFn: undefined,
    refetchOnWindowFocus: false,
  });

  // Mutation to delete calendar integration
  const deleteMutation = useMutation({
    mutationFn: async (provider: string) => {
      return apiRequest('DELETE', `/api/calendar/integrations/${provider}`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Calendar integration removed successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/integrations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to remove calendar integration: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Mutation to toggle active state
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ provider, isActive }: { provider: string, isActive: boolean }) => {
      return apiRequest('PATCH', `/api/calendar/integrations/${provider}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Calendar integration updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/integrations'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: `Failed to update calendar integration: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  // Function to handle manual sync
  const handleSync = async (provider: string) => {
    try {
      setIsSyncing(true);
      const response = await apiRequest('POST', `/api/calendar/sync/${provider}`);
      const data = await response.json();
      
      toast({
        title: 'Success',
        description: `Synced ${data.syncedCount} events to your calendar`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/integrations'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to sync calendar: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Function to handle Google auth
  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', '/api/calendar/auth/google');
      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to connect to Google Calendar: ${error.message}`,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  // Function to format last synced date
  const formatLastSynced = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Calendar Integration</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Connect your calendar to automatically sync team events</p>
      </div>

      <div className="space-y-4">
        {/* Google Calendar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <FcGoogle className="w-8 h-8" />
                <div>
                  <h4 className="font-medium">Google Calendar</h4>
                  <p className="text-sm text-gray-500">
                    {integrations?.google ? (
                      integrations.google.isActive ? "Connected and active" : "Connected but inactive"
                    ) : "Not connected"}
                  </p>
                  {integrations?.google && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last synced: {formatLastSynced(integrations.google.lastSyncedAt)}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {integrations?.google ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="google-active"
                        checked={integrations.google.isActive}
                        onCheckedChange={(checked) => 
                          toggleActiveMutation.mutate({ provider: 'google', isActive: checked })
                        }
                      />
                      <Label htmlFor="google-active" className="text-sm">Active</Label>
                    </div>
                    
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handleSync('google')}
                      disabled={isSyncing || !integrations.google.isActive}
                    >
                      {isSyncing ? "Syncing..." : "Sync Now"}
                    </Button>
                    
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Are you sure you want to disconnect Google Calendar?")) {
                          deleteMutation.mutate('google');
                        }
                      }}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={handleGoogleAuth}
                    disabled={isLoading}
                  >
                    {isLoading ? "Connecting..." : "Connect"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Apple Calendar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <SiApple className="w-7 h-7" />
                <div>
                  <h4 className="font-medium">Apple Calendar</h4>
                  <p className="text-sm text-gray-500">
                    Use iCal download from any event
                  </p>
                </div>
              </div>
              
              <Button 
                variant="outline"
                onClick={() => toast({
                  title: "Info",
                  description: "For Apple Calendar, simply download the iCal file from any event and open it with Apple Calendar."
                })}
              >
                Learn How
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-md border border-amber-200 dark:border-amber-800">
        <h4 className="font-medium text-amber-800 dark:text-amber-300">Note</h4>
        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
          Calendar sync will automatically add team events to your calendar. You can also download individual events as iCal files from any event details page.
        </p>
      </div>
    </div>
  );
}