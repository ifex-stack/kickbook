import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

const bookingFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  location: z.string().min(3, "Location is required"),
  format: z.enum(["5-a-side", "7-a-side", "11-a-side"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  totalSlots: z.number().min(2, "Must have at least 2 slots"),
  isRecurring: z.boolean().optional(),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: Date;
}

export function CreateBookingModal({ isOpen, onClose, selectedDate = new Date() }: CreateBookingModalProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<string>("7-a-side");
  
  const defaultStartTime = new Date(selectedDate);
  defaultStartTime.setHours(18, 0, 0); // Default to 6:00 PM
  
  const defaultEndTime = new Date(selectedDate);
  defaultEndTime.setHours(20, 0, 0); // Default to 8:00 PM
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      title: "",
      location: "",
      format: "7-a-side",
      startTime: format(defaultStartTime, "yyyy-MM-dd'T'HH:mm"),
      endTime: format(defaultEndTime, "yyyy-MM-dd'T'HH:mm"),
      totalSlots: getDefaultSlots("7-a-side"),
      isRecurring: false,
    }
  });
  
  function getDefaultSlots(format: string) {
    switch (format) {
      case "5-a-side": return 10;
      case "7-a-side": return 14;
      case "11-a-side": return 22;
      default: return 14;
    }
  }
  
  const handleFormatChange = (value: string) => {
    setFormat(value);
    setValue('format', value as "5-a-side" | "7-a-side" | "11-a-side");
    setValue('totalSlots', getDefaultSlots(value));
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      const bookingData = {
        ...data,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        availableSlots: data.totalSlots,
      };
      
      await apiRequest("POST", "/api/bookings", bookingData);
      
      toast({
        title: "Booking Created",
        description: "New session has been added to the calendar",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      reset();
      onClose();
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-medium text-gray-900 dark:text-gray-100">Book New Session</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Session Title</Label>
            <Input 
              id="title" 
              {...register("title")}
              className="mt-1"
              placeholder="e.g. Practice Session, League Match"
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              {...register("location")}
              className="mt-1"
              placeholder="e.g. Central Park Field #3"
            />
            {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location.message}</p>}
          </div>
          
          <div>
            <Label htmlFor="format">Format</Label>
            <Select 
              onValueChange={handleFormatChange}
              defaultValue={format}
            >
              <SelectTrigger id="format" className="w-full mt-1">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5-a-side">5-a-side</SelectItem>
                <SelectItem value="7-a-side">7-a-side</SelectItem>
                <SelectItem value="11-a-side">11-a-side</SelectItem>
              </SelectContent>
            </Select>
            {errors.format && <p className="text-sm text-red-500 mt-1">{errors.format.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input 
                id="startTime" 
                type="datetime-local"
                {...register("startTime")}
                className="mt-1"
              />
              {errors.startTime && <p className="text-sm text-red-500 mt-1">{errors.startTime.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input 
                id="endTime" 
                type="datetime-local"
                {...register("endTime")}
                className="mt-1"
              />
              {errors.endTime && <p className="text-sm text-red-500 mt-1">{errors.endTime.message}</p>}
            </div>
          </div>
          
          <div>
            <Label htmlFor="totalSlots">Total Slots</Label>
            <Input 
              id="totalSlots" 
              type="number"
              {...register("totalSlots", { valueAsNumber: true })}
              className="mt-1"
            />
            {errors.totalSlots && <p className="text-sm text-red-500 mt-1">{errors.totalSlots.message}</p>}
            <p className="text-xs text-gray-500 mt-1">
              Recommended: {getDefaultSlots(format)} slots for {format}
            </p>
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Booking
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
