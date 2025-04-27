import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Booking } from "@shared/schema";
import { format } from "date-fns";

const playerBookingFormSchema = z.object({
  playerName: z.string().min(1, "Your name is required"),
  playerEmail: z.string().email("Invalid email address"),
  playerPhone: z.string().optional(),
  agreeToTerms: z.boolean().refine(value => value === true, {
    message: "You must agree to the terms and conditions",
  }),
});

export type PlayerBookingFormData = z.infer<typeof playerBookingFormSchema>;

interface BookingFormPlayerProps {
  booking: Booking;
  onSubmit: (data: PlayerBookingFormData) => Promise<void>;
  onCancel: () => void;
  isPending?: boolean;
}

export function BookingFormPlayer({ booking, onSubmit, onCancel, isPending = false }: BookingFormPlayerProps) {
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<PlayerBookingFormData>({
    resolver: zodResolver(playerBookingFormSchema),
    defaultValues: {
      playerName: "",
      playerEmail: "",
      playerPhone: "",
      agreeToTerms: false,
    }
  });

  const handleFormSubmit = async (data: PlayerBookingFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Error joining session:", error);
      toast({
        title: "Error",
        description: "Failed to join session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (date: Date) => {
    return format(new Date(date), "EEE, MMM d • h:mm a");
  };

  return (
    <div className="space-y-4">
      {/* Booking Details (Read-only) */}
      <div className="rounded-lg bg-secondary-DEFAULT/10 p-4 mb-4">
        <h3 className="text-lg font-semibold">{booking.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{booking.location}</p>
        <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="material-icons text-sm mr-1">calendar_today</span>
          <time>{formatTime(booking.startTime)} - {format(new Date(booking.endTime), "h:mm a")}</time>
        </div>
        <div className="mt-2 flex items-center">
          <span className={`px-2 py-1 text-xs rounded-md ${
            booking.format === "5-a-side" 
              ? "bg-secondary-DEFAULT bg-opacity-10 text-secondary-DEFAULT"
              : booking.format === "11-a-side"
              ? "bg-accent-DEFAULT bg-opacity-10 text-accent-DEFAULT"
              : "bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT"
          }`}>
            {booking.format}
          </span>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {booking.availableSlots} slots available
          </span>
        </div>
      </div>
      
      {/* Player Info Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="playerName">Your Name</Label>
          <Input 
            id="playerName" 
            {...register("playerName")}
            className="mt-1"
            placeholder="Enter your full name"
          />
          {errors.playerName && <p className="text-sm text-red-500 mt-1">{errors.playerName.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="playerEmail">Email Address</Label>
          <Input 
            id="playerEmail" 
            type="email"
            {...register("playerEmail")}
            className="mt-1"
            placeholder="your.email@example.com"
          />
          {errors.playerEmail && <p className="text-sm text-red-500 mt-1">{errors.playerEmail.message}</p>}
        </div>
        
        <div>
          <Label htmlFor="playerPhone">Phone Number (optional)</Label>
          <Input 
            id="playerPhone" 
            {...register("playerPhone")}
            className="mt-1"
            placeholder="Enter your phone number"
          />
          {errors.playerPhone && <p className="text-sm text-red-500 mt-1">{errors.playerPhone.message}</p>}
        </div>
        
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="agreeToTerms"
            {...register("agreeToTerms")}
            className="mt-1"
          />
          <Label htmlFor="agreeToTerms" className="text-sm">
            I agree to the terms and conditions, including the cancellation policy
          </Label>
        </div>
        {errors.agreeToTerms && <p className="text-sm text-red-500 mt-1">{errors.agreeToTerms.message}</p>}
        
        <div className="flex justify-end space-x-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                Joining...
              </>
            ) : (
              <>Join Session</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}