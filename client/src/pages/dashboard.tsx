import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TeamStats } from "@/components/team/team-stats";
import { BookingCalendar } from "@/components/bookings/booking-calendar";
import { UpcomingMatches } from "@/components/bookings/upcoming-matches";
import { CreateBookingModal } from "@/components/bookings/create-booking-modal";
import { BookingDetailsModal } from "@/components/bookings/booking-details-modal";
import { Walkthrough } from "@/components/onboarding/walkthrough";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  
  // Check if this is the first visit
  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem('hasSeenWalkthrough');
    if (!hasSeenWalkthrough) {
      setShowWalkthrough(true);
    }
  }, []);
  
  const handleWalkthroughComplete = () => {
    localStorage.setItem('hasSeenWalkthrough', 'true');
    setShowWalkthrough(false);
    
    toast({
      title: "Welcome to KickBook!",
      description: "You're all set up. Start by creating your first booking.",
    });
  };
  
  const handleWalkthroughSkip = () => {
    localStorage.setItem('hasSeenWalkthrough', 'true');
    setShowWalkthrough(false);
  };
  
  const { data: bookings, isLoading: isLoadingBookings } = useQuery({
    queryKey: ["/api/bookings"],
    queryFn: undefined, // Using the default query function from queryClient
  });
  
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
  
  // Get calendar bookings in correct format
  const calendarBookings = bookings ? bookings.map((booking: any) => ({
    id: booking.id,
    date: new Date(booking.startTime),
    title: booking.title,
    availableSlots: booking.availableSlots,
    totalSlots: booking.totalSlots,
  })) : [];
  
  // Get upcoming matches
  const upcomingMatches = bookings ? bookings
    .filter((booking: any) => new Date(booking.startTime) > new Date())
    .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3)
    .map((booking: any) => ({
      id: booking.id,
      title: booking.title,
      location: booking.location,
      startTime: new Date(booking.startTime),
      endTime: new Date(booking.endTime),
      format: booking.format,
      attendees: [], // This would be populated from player bookings in a real implementation
    })) : [];
  
  // Calculate team stats
  const stats = {
    totalPlayers: teamMembers?.length || 0,
    upcomingMatches: bookings?.filter((b: any) => new Date(b.startTime) > new Date()).length || 0,
    seasonWins: teamStats?.wins || 0,
    totalGoals: teamStats?.goals || 0,
  };
  
  return (
    <AppShell user={{ name: user?.name || "User", role: user?.role || "player" }}>
      <PageHeader 
        title="Dashboard" 
        description="Welcome back to your team's dashboard"
        actions={
          user?.role === "admin" && (
            <Button onClick={() => setShowCreateBooking(true)}>
              <span className="material-icons text-sm mr-2">add</span>
              Create Booking
            </Button>
          )
        }
      />
      
      <TeamStats 
        totalPlayers={stats.totalPlayers}
        upcomingMatches={stats.upcomingMatches}
        seasonWins={stats.seasonWins}
        totalGoals={stats.totalGoals}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BookingCalendar 
            bookings={calendarBookings}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setShowCreateBooking(true);
            }}
          />
        </div>
        
        <div>
          <UpcomingMatches 
            matches={upcomingMatches}
            onViewDetails={(match) => {
              const booking = bookings?.find((b: any) => b.id === match.id);
              if (booking) {
                setSelectedBooking(booking);
              }
            }}
            onBookNew={() => setShowCreateBooking(true)}
          />
        </div>
      </div>
      
      {/* Modals */}
      {showWalkthrough && (
        <Walkthrough 
          onComplete={handleWalkthroughComplete} 
          onSkip={handleWalkthroughSkip} 
        />
      )}
      
      {showCreateBooking && (
        <CreateBookingModal 
          isOpen={showCreateBooking}
          onClose={() => setShowCreateBooking(false)}
          selectedDate={selectedDate || undefined}
        />
      )}
      
      {selectedBooking && (
        <BookingDetailsModal 
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
          onEnterStats={() => navigate(`/statistics?bookingId=${selectedBooking.id}`)}
        />
      )}
    </AppShell>
  );
}
