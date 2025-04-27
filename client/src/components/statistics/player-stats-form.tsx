import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { getInitials } from "@/lib/utils";

const playerStatsSchema = z.object({
  goals: z.number().min(0, "Cannot be negative"),
  assists: z.number().min(0, "Cannot be negative"),
  yellowCards: z.number().min(0, "Cannot be negative"),
  redCards: z.number().min(0, "Cannot be negative"),
  minutesPlayed: z.number().min(0, "Cannot be negative").max(120, "Maximum 120 minutes"),
  isInjured: z.boolean().optional(),
});

type PlayerStatsData = z.infer<typeof playerStatsSchema>;

interface PlayerStatsFormProps {
  bookingId: number;
  playerId: number;
  playerName: string;
  onComplete: () => void;
  onBack: () => void;
}

export function PlayerStatsForm({ bookingId, playerId, playerName, onComplete, onBack }: PlayerStatsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if stats already exist for this player and booking
  const { data: existingStats, isLoading } = useQuery({
    queryKey: [`/api/bookings/${bookingId}/players/${playerId}/stats`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: !!bookingId && !!playerId,
  });
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<PlayerStatsData>({
    resolver: zodResolver(playerStatsSchema),
    defaultValues: {
      goals: existingStats?.goals || 0,
      assists: existingStats?.assists || 0,
      yellowCards: existingStats?.yellowCards || 0,
      redCards: existingStats?.redCards || 0,
      minutesPlayed: existingStats?.minutesPlayed || 90,
      isInjured: existingStats?.isInjured || false,
    }
  });

  // Update form values when existing stats are loaded
  useState(() => {
    if (existingStats) {
      setValue('goals', existingStats.goals || 0);
      setValue('assists', existingStats.assists || 0);
      setValue('yellowCards', existingStats.yellowCards || 0);
      setValue('redCards', existingStats.redCards || 0);
      setValue('minutesPlayed', existingStats.minutesPlayed || 90);
      setValue('isInjured', existingStats.isInjured || false);
    }
  });

  const onSubmit = async (data: PlayerStatsData) => {
    try {
      setIsSubmitting(true);
      
      const apiMethod = existingStats ? "PUT" : "POST";
      const endpoint = `/api/bookings/${bookingId}/players/${playerId}/stats`;
      
      await apiRequest(apiMethod, endpoint, data);
      
      toast({
        title: "Player Stats Recorded",
        description: "Player statistics have been saved successfully",
      });
      
      queryClient.invalidateQueries({ 
        queryKey: [`/api/bookings/${bookingId}/players/${playerId}/stats`] 
      });
      queryClient.invalidateQueries({ 
        queryKey: [`/api/players/${playerId}/stats`] 
      });
      onComplete();
    } catch (error) {
      console.error("Error saving player stats:", error);
      toast({
        title: "Error",
        description: "Failed to save player statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex justify-center p-6">
            <div className="animate-spin w-8 h-8 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:text-primary-light flex items-center justify-center mr-3">
            {getInitials(playerName)}
          </div>
          <CardTitle>{playerName}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form id={`player-stats-form-${playerId}`} onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`goals-${playerId}`}>Goals</Label>
              <Input
                id={`goals-${playerId}`}
                type="number"
                min="0"
                {...register("goals", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.goals && (
                <p className="text-sm text-red-500 mt-1">{errors.goals.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`assists-${playerId}`}>Assists</Label>
              <Input
                id={`assists-${playerId}`}
                type="number"
                min="0"
                {...register("assists", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.assists && (
                <p className="text-sm text-red-500 mt-1">{errors.assists.message}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`yellowCards-${playerId}`}>Yellow Cards</Label>
              <Input
                id={`yellowCards-${playerId}`}
                type="number"
                min="0"
                {...register("yellowCards", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.yellowCards && (
                <p className="text-sm text-red-500 mt-1">{errors.yellowCards.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`redCards-${playerId}`}>Red Cards</Label>
              <Input
                id={`redCards-${playerId}`}
                type="number"
                min="0"
                {...register("redCards", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.redCards && (
                <p className="text-sm text-red-500 mt-1">{errors.redCards.message}</p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor={`minutesPlayed-${playerId}`}>Minutes Played</Label>
            <Input
              id={`minutesPlayed-${playerId}`}
              type="number"
              min="0"
              max="120"
              {...register("minutesPlayed", { valueAsNumber: true })}
              className="mt-1"
            />
            {errors.minutesPlayed && (
              <p className="text-sm text-red-500 mt-1">{errors.minutesPlayed.message}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id={`isInjured-${playerId}`}
              {...register("isInjured")}
            />
            <Label htmlFor={`isInjured-${playerId}`}>Player got injured during this match</Label>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          type="submit" 
          form={`player-stats-form-${playerId}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Saving...
            </>
          ) : (
            "Save Player Stats"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
