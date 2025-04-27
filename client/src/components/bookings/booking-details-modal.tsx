import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTimeRange, getInitials } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";
import { Calendar, Download, Users, ListChecks, PlusCircle } from "lucide-react";
import { TeamSelection } from "./team-selection";
import { Booking, User } from "@shared/schema";
import { BookingFormPlayer, PlayerBookingFormData } from "./booking-form-player";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onEnterStats: () => void;
}

export function BookingDetailsModal({ isOpen, onClose, booking, onEnterStats }: BookingDetailsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  
  const { data: attendees, isLoading } = useQuery({
    queryKey: [`/api/bookings/${booking?.id}/players`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: isOpen && !!booking?.id,
  });
  
  const { data: playerBookings } = useQuery({
    queryKey: [`/api/players/${user?.id}/bookings`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: isOpen && !!booking?.id && !!user?.id,
  });
  
  const isUserAttending = attendees?.some((attendee: any) => attendee.playerId === user?.id);
  
  const handleJoinSession = async () => {
    if (!booking || !user) return;
    
    try {
      setIsJoining(true);
      await apiRequest("POST", `/api/bookings/${booking.id}/players`, { 
        playerId: user.id 
      });
      
      toast({
        title: "Success",
        description: "You've joined the session",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${booking.id}/players`] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    } catch (error) {
      console.error("Error joining session:", error);
      toast({
        title: "Error",
        description: "Failed to join session. It might be full or you're already attending.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };
  
  const handleLeaveSession = async () => {
    if (!booking || !user) return;
    
    try {
      setIsLeaving(true);
      await apiRequest("DELETE", `/api/bookings/${booking.id}/players/${user.id}`);
      
      toast({
        title: "Success",
        description: "You've left the session",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${booking.id}/players`] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    } catch (error) {
      console.error("Error leaving session:", error);
      toast({
        title: "Error",
        description: "Failed to leave session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLeaving(false);
    }
  };
  
  const handlePlayerJoin = async (data: PlayerBookingFormData) => {
    if (!booking) return;
    
    try {
      setIsJoining(true);
      await apiRequest("POST", `/api/bookings/${booking.id}/players`, { 
        playerName: data.playerName,
        playerEmail: data.playerEmail,
        playerPhone: data.playerPhone,
        playerId: user?.id || null
      });
      
      toast({
        title: "Success",
        description: "You've joined the session!",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${booking.id}/players`] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      
      // Close the join tab and show details
      setActiveTab("details");
    } catch (error) {
      console.error("Error joining session:", error);
      toast({
        title: "Error",
        description: "Failed to join session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (!booking) return null;
  
  const isPastBooking = new Date(booking.endTime) < new Date();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-medium text-gray-900 dark:text-gray-100">Session Details</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="details" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="details" className="flex items-center">
              <ListChecks className="w-4 h-4 mr-2" />
              Details
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Team Selection
            </TabsTrigger>
            <TabsTrigger value="join" className="flex items-center">
              <PlusCircle className="w-4 h-4 mr-2" />
              Join Session
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            {/* Booking header */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{booking.title}</h3>
              <p className="text-gray-500 dark:text-gray-400">{booking.location}</p>
              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <span className="material-icons text-sm mr-1">calendar_today</span>
                {formatTimeRange(booking.startTime, booking.endTime)}
              </div>
              <div className="mt-2 flex items-center text-sm">
                <span className={`px-2 py-1 text-xs rounded-md ${
                  booking.format === "5-a-side" 
                    ? "bg-secondary-DEFAULT bg-opacity-10 text-secondary-DEFAULT"
                    : booking.format === "11-a-side"
                    ? "bg-accent-DEFAULT bg-opacity-10 text-accent-DEFAULT"
                    : "bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT"
                }`}>
                  {booking.format}
                </span>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {booking.availableSlots} / {booking.totalSlots} slots available
                </span>
              </div>
            </div>
            
            <Separator />
            
            {/* Attendees */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Attendees</h4>
              {isLoading ? (
                <div className="p-4 flex justify-center">
                  <div className="animate-spin w-6 h-6 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
                </div>
              ) : attendees && attendees.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {attendees.map((attendee: any) => (
                    <Card key={attendee.id} className="p-2 flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:text-primary-light flex items-center justify-center">
                        {getInitials(attendee.playerName || "User")}
                      </div>
                      <p className="text-xs text-center mt-1 truncate w-full">
                        {attendee.playerName || "User"}
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No attendees yet</p>
              )}
            </div>
            
            <div className="flex justify-end">
              <a 
                href={`/api/calendar/download/${booking.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-primary-DEFAULT hover:text-primary-dark transition-colors"
              >
                <Calendar className="w-4 h-4 mr-1" />
                Add to calendar
              </a>
            </div>
          </TabsContent>
          
          <TabsContent value="teams">
            {attendees && (
              <TeamSelection 
                booking={booking} 
                playersRegistered={attendees.map((a: any) => ({
                  id: a.playerId,
                  name: a.playerName,
                  email: a.playerEmail || 'player@example.com'
                }))} 
              />
            )}
          </TabsContent>

          <TabsContent value="join" className="space-y-4">
            {!isPastBooking && booking.availableSlots > 0 && !isUserAttending && (
              <BookingFormPlayer 
                booking={booking}
                onSubmit={handlePlayerJoin}
                onCancel={onClose}
                isPending={isJoining}
              />
            )}
            {!isPastBooking && booking.availableSlots === 0 && !isUserAttending && (
              <div className="p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">This session is fully booked.</p>
                <p className="mt-2 text-sm text-gray-500">Check back later or join another session.</p>
              </div>
            )}
            {!isPastBooking && isUserAttending && (
              <div className="p-6 text-center">
                <p className="text-green-600 dark:text-green-400">You are already registered for this session.</p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleLeaveSession}
                  disabled={isLeaving}
                  className="mt-4"
                >
                  {isLeaving ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></span>
                      Leaving...
                    </>
                  ) : (
                    <>Leave Session</>
                  )}
                </Button>
              </div>
            )}
            {isPastBooking && (
              <div className="p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">This session has already taken place.</p>
              </div>
            )}
          </TabsContent>
          
          <div className="mt-4">
            <DialogFooter className="flex flex-col space-y-2 sm:space-y-0">
              {!isPastBooking && (
                isUserAttending ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleLeaveSession}
                    disabled={isLeaving}
                    className="w-full sm:w-auto"
                  >
                    {isLeaving ? (
                      <>
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></span>
                        Leaving...
                      </>
                    ) : (
                      <>Leave Session</>
                    )}
                  </Button>
                ) : (
                  booking.availableSlots > 0 && (
                    <Button 
                      type="button" 
                      onClick={() => setActiveTab("join")}
                      className="w-full sm:w-auto"
                    >
                      Join Session
                    </Button>
                  )
                )
              )}
              
              {isPastBooking && user?.role === "admin" && (
                <Button 
                  type="button" 
                  onClick={onEnterStats}
                  className="w-full sm:w-auto"
                >
                  Enter Match Stats
                </Button>
              )}
              
              <Button 
                type="button" 
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
