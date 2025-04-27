import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatTimeRange, getInitials } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/components/auth/auth-provider";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
  onEnterStats: () => void;
}

export function BookingDetailsModal({ isOpen, onClose, booking, onEnterStats }: BookingDetailsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  
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

  if (!booking) return null;
  
  const isPastBooking = new Date(booking.endTime) < new Date();
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-medium text-gray-900 dark:text-gray-100">Session Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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
                    onClick={handleJoinSession}
                    disabled={isJoining}
                    className="w-full sm:w-auto"
                  >
                    {isJoining ? (
                      <>
                        <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Joining...
                      </>
                    ) : (
                      <>Join Session</>
                    )}
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
      </DialogContent>
    </Dialog>
  );
}
