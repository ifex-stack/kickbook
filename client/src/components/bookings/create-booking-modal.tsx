import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { BookingFormAdmin, BookingFormData } from "./booking-form-admin";
import { useAuth } from "@/components/auth/auth-provider";
import { UserRole } from "@shared/types";

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
}

export function CreateBookingModal({ isOpen, onClose, selectedDate = new Date() }: CreateBookingModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Only admins or owners can create and pre-populate sessions
  const isAdminOrOwner = user?.role === UserRole.ADMIN || user?.role === UserRole.OWNER;

  // Get current user data to ensure we have the team ID
  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Failed to get user data");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);
      
      // Get current user data to ensure we're authenticated and have a team ID
      const userData = await fetchUserData();
      console.log("User data:", userData);
      
      if (!userData.teamId) {
        throw new Error("User not associated with a team");
      }
      
      // Only include fields that are defined in the schema
      // Use ISO strings for dates - the server will handle conversion
      const bookingData = {
        ...data,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        availableSlots: data.totalSlots,
        status: "active", // Set the initial status as active
        teamId: userData.teamId,
        isRecurring: data.isRecurring || false
      };
      
      console.log("Sending booking data:", bookingData);
      
      try {
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingData),
          credentials: "include"
        });
        
        const responseText = await response.text();
        console.log("Response status:", response.status);
        console.log("Response text:", responseText);
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
            console.error("Server returned error:", errorData);
            throw new Error(errorData.message || "Failed to create booking");
          } catch (parseError) {
            console.error("Error parsing error response:", parseError);
            throw new Error(`${response.status}: ${responseText}`);
          }
        }
        
        toast({
          title: "Booking Created",
          description: "New session has been added to the calendar",
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
        setIsSubmitting(false);
        onClose();
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }
    } catch (error: any) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  // If user is not admin or owner, we show a message instead of the form
  if (!isAdminOrOwner) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-heading font-medium text-gray-900 dark:text-gray-100">Permission Required</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <p>Only team admins and owners can create new bookings.</p>
            <p className="mt-2 text-sm text-gray-500">Please contact your team administrator for assistance.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-medium text-gray-900 dark:text-gray-100">Book New Session</DialogTitle>
        </DialogHeader>
        
        <BookingFormAdmin 
          onSubmit={onSubmit} 
          onCancel={onClose} 
          selectedDate={selectedDate}
        />
      </DialogContent>
    </Dialog>
  );
}
