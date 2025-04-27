import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchStatsForm } from "@/components/statistics/match-stats-form";
import { PlayerStatsForm } from "@/components/statistics/player-stats-form";
import { formatTimeRange, getInitials } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function Statistics() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  
  // Get bookingId from query parameters
  const params = new URLSearchParams(location.split("?")[1] || "");
  const bookingId = params.get("bookingId") ? parseInt(params.get("bookingId") as string) : null;
  
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  
  // Get booking details
  const { data: booking, isLoading: isLoadingBooking } = useQuery({
    queryKey: [`/api/bookings/${bookingId}`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: !!bookingId,
  });
  
  // Get booking attendees
  const { data: attendees, isLoading: isLoadingAttendees } = useQuery({
    queryKey: [`/api/bookings/${bookingId}/players`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: !!bookingId,
  });
  
  // Get match stats
  const { data: matchStats, isLoading: isLoadingMatchStats } = useQuery({
    queryKey: [`/api/bookings/${bookingId}/stats`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: !!bookingId,
  });
  
  // Get recent past bookings for stats entry if no bookingId is provided
  const { data: pastBookings, isLoading: isLoadingPastBookings } = useQuery({
    queryKey: ["/api/bookings/past"],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: !bookingId,
  });
  
  // If a player is selected, redirect to the player stats tab
  useEffect(() => {
    if (selectedPlayerId) {
      setActiveTab("playerStats");
    }
  }, [selectedPlayerId]);
  
  // Determine if the booking is in the past
  const isPastBooking = booking ? new Date(booking.endTime) < new Date() : false;
  
  const handleStatsSaved = () => {
    if (activeTab === "matchStats") {
      setActiveTab("playerStats");
    } else if (activeTab === "playerStats" && selectedPlayerId) {
      setSelectedPlayerId(null);
      setActiveTab("overview");
    }
  };
  
  return (
    <AppShell user={{ name: user?.name || "User", role: user?.role || "player" }}>
      <PageHeader 
        title="Statistics" 
        description="View and record match and player statistics"
      />
      
      {bookingId ? (
        isLoadingBooking ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
          </div>
        ) : booking ? (
          <div className="space-y-6">
            {/* Booking info */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{booking.title}</h2>
                    <p className="text-gray-600 dark:text-gray-400">{booking.location}</p>
                    <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span className="material-icons text-sm mr-1">calendar_today</span>
                      {formatTimeRange(booking.startTime, booking.endTime)}
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className={`px-2 py-1 text-xs rounded-md ${
                      booking.format === "5-a-side" 
                        ? "bg-secondary-DEFAULT bg-opacity-10 text-secondary-DEFAULT"
                        : booking.format === "11-a-side"
                        ? "bg-accent-DEFAULT bg-opacity-10 text-accent-DEFAULT"
                        : "bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT"
                    }`}>
                      {booking.format}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {isPastBooking ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  {user?.role === "admin" && !matchStats?.id && (
                    <TabsTrigger value="matchStats">Match Stats</TabsTrigger>
                  )}
                  {user?.role === "admin" && (matchStats?.id || activeTab === "playerStats") && (
                    <TabsTrigger value="playerStats">Player Stats</TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Match result card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Match Result</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingMatchStats ? (
                          <div className="flex justify-center py-6">
                            <div className="animate-spin w-6 h-6 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
                          </div>
                        ) : matchStats?.id ? (
                          <div>
                            <div className="flex justify-center items-center mb-4">
                              <div className="text-center px-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Our Team</p>
                                <p className="text-4xl font-bold stats-value">{matchStats.teamScore}</p>
                              </div>
                              <div className="text-xl font-semibold px-4">vs</div>
                              <div className="text-center px-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {matchStats.opponentName || "Opponent"}
                                </p>
                                <p className="text-4xl font-bold stats-value">{matchStats.opponentScore}</p>
                              </div>
                            </div>
                            <div className="text-center">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                matchStats.isWin 
                                  ? "bg-success bg-opacity-10 text-success"
                                  : matchStats.isDraw
                                  ? "bg-warning bg-opacity-10 text-warning"
                                  : "bg-error bg-opacity-10 text-error"
                              }`}>
                                {matchStats.isWin ? "Win" : matchStats.isDraw ? "Draw" : "Loss"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-gray-500 dark:text-gray-400">No match statistics recorded yet</p>
                            {user?.role === "admin" && (
                              <Button 
                                className="mt-4"
                                onClick={() => setActiveTab("matchStats")}
                              >
                                Enter Match Stats
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Attendees card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Players</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAttendees ? (
                          <div className="flex justify-center py-6">
                            <div className="animate-spin w-6 h-6 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
                          </div>
                        ) : attendees && attendees.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {attendees.map((attendee: any) => (
                              <Card 
                                key={attendee.id} 
                                className="p-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                onClick={() => user?.role === "admin" && setSelectedPlayerId(attendee.playerId)}
                              >
                                <div className="w-10 h-10 rounded-full bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:text-primary-light flex items-center justify-center mr-3">
                                  {getInitials(attendee.playerName || "User")}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{attendee.playerName || "User"}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {attendee.playerStats ? (
                                      <>G: {attendee.playerStats.goals} A: {attendee.playerStats.assists}</>
                                    ) : (
                                      "No stats"
                                    )}
                                  </p>
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-gray-500 dark:text-gray-400">No players recorded for this session</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="matchStats">
                  <MatchStatsForm 
                    bookingId={bookingId}
                    onComplete={handleStatsSaved}
                  />
                </TabsContent>
                
                <TabsContent value="playerStats">
                  {selectedPlayerId ? (
                    <PlayerStatsForm 
                      bookingId={bookingId}
                      playerId={selectedPlayerId}
                      playerName={attendees?.find((a: any) => a.playerId === selectedPlayerId)?.playerName || "Player"}
                      onComplete={handleStatsSaved}
                      onBack={() => setSelectedPlayerId(null)}
                    />
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Select Player</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoadingAttendees ? (
                          <div className="flex justify-center py-6">
                            <div className="animate-spin w-6 h-6 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
                          </div>
                        ) : attendees && attendees.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {attendees.map((attendee: any) => (
                              <Card 
                                key={attendee.id} 
                                className="p-3 flex flex-col items-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                onClick={() => setSelectedPlayerId(attendee.playerId)}
                              >
                                <div className="w-12 h-12 rounded-full bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:text-primary-light flex items-center justify-center mb-2">
                                  {getInitials(attendee.playerName || "User")}
                                </div>
                                <p className="font-medium text-sm text-center">{attendee.playerName || "User"}</p>
                                <div className="mt-2 flex items-center text-xs">
                                  {attendee.playerStats ? (
                                    <span className="px-2 py-1 rounded-md bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT">
                                      Stats Recorded
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">
                                      No Stats
                                    </span>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-gray-500 dark:text-gray-400">No players recorded for this session</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <span className="material-icons text-4xl text-gray-400 dark:text-gray-600 mb-2">event_upcoming</span>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                    This session hasn't happened yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    You can record statistics after the session has ended
                  </p>
                  <Button variant="outline" onClick={() => navigate("/statistics")}>
                    View Other Sessions
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <span className="material-icons text-4xl text-gray-400 dark:text-gray-600 mb-2">error_outline</span>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                Session not found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                The session you're looking for doesn't exist or you don't have access to it
              </p>
              <Button variant="outline" onClick={() => navigate("/statistics")}>
                View All Sessions
              </Button>
            </CardContent>
          </Card>
        )
      ) : (
        // No bookingId provided, show list of past bookings
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Past Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingPastBookings ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin w-6 h-6 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
                </div>
              ) : pastBookings && pastBookings.length > 0 ? (
                <div className="space-y-4">
                  {pastBookings.map((booking: any) => (
                    <Card 
                      key={booking.id} 
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => navigate(`/statistics?bookingId=${booking.id}`)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {booking.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {booking.location}
                          </p>
                          <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400">
                            <span className="material-icons text-xs mr-1">calendar_today</span>
                            {formatTimeRange(booking.startTime, booking.endTime)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`px-2 py-1 text-xs rounded-md ${
                            booking.format === "5-a-side" 
                              ? "bg-secondary-DEFAULT bg-opacity-10 text-secondary-DEFAULT"
                              : booking.format === "11-a-side"
                              ? "bg-accent-DEFAULT bg-opacity-10 text-accent-DEFAULT"
                              : "bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT"
                          }`}>
                            {booking.format}
                          </span>
                          {booking.hasStats ? (
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Stats recorded
                            </span>
                          ) : user?.role === "admin" ? (
                            <span className="text-xs text-primary-DEFAULT dark:text-primary-light mt-1">
                              Record stats
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">No past sessions found</p>
                  <Button 
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/bookings")}
                  >
                    View All Bookings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
