import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const bookingFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  location: z.string().min(3, "Location is required"),
  format: z.enum(["5-a-side", "7-a-side", "11-a-side"]),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  totalSlots: z.number().min(2, "Must have at least 2 slots"),
  isRecurring: z.boolean().optional().default(false),
  status: z.string().optional().default("active"),
});

export type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormAdminProps {
  onSubmit: (data: BookingFormData) => Promise<void>;
  onCancel: () => void;
  selectedDate?: Date;
}

export function BookingFormAdmin({ onSubmit, onCancel, selectedDate = new Date() }: BookingFormAdminProps) {
  const { toast } = useToast();
  const [matchFormat, setMatchFormat] = useState<string>("7-a-side");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      status: "active"
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
    setMatchFormat(value);
    setValue('format', value as "5-a-side" | "7-a-side" | "11-a-side");
    setValue('totalSlots', getDefaultSlots(value));
  };

  const handleFormSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
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
          defaultValue={matchFormat}
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
          Recommended: {getDefaultSlots(matchFormat)} slots for {matchFormat}
        </p>
      </div>
      
      <div className="flex justify-end space-x-2 mt-6">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Creating...
            </>
          ) : (
            <>Create Booking</>
          )}
        </Button>
      </div>
    </form>
  );
}