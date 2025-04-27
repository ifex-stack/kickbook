import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const matchStatsSchema = z.object({
  teamScore: z.number().min(0, "Score cannot be negative"),
  opponentScore: z.number().min(0, "Score cannot be negative"),
  opponentName: z.string().optional(),
});

type MatchStatsData = z.infer<typeof matchStatsSchema>;

interface MatchStatsFormProps {
  bookingId: number;
  onComplete: () => void;
}

export function MatchStatsForm({ bookingId, onComplete }: MatchStatsFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<MatchStatsData>({
    resolver: zodResolver(matchStatsSchema),
    defaultValues: {
      teamScore: 0,
      opponentScore: 0,
      opponentName: "",
    }
  });

  const onSubmit = async (data: MatchStatsData) => {
    try {
      setIsSubmitting(true);
      
      await apiRequest("POST", `/api/bookings/${bookingId}/stats`, {
        teamScore: data.teamScore,
        opponentScore: data.opponentScore,
        opponentName: data.opponentName || "Opponent",
      });
      
      toast({
        title: "Match Stats Recorded",
        description: "Match statistics have been saved successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/bookings/${bookingId}/stats`] });
      onComplete();
    } catch (error) {
      console.error("Error saving match stats:", error);
      toast({
        title: "Error",
        description: "Failed to save match statistics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match Result</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="match-stats-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="teamScore">Our Score</Label>
              <Input
                id="teamScore"
                type="number"
                min="0"
                {...register("teamScore", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.teamScore && (
                <p className="text-sm text-red-500 mt-1">{errors.teamScore.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="opponentScore">Opponent Score</Label>
              <Input
                id="opponentScore"
                type="number"
                min="0"
                {...register("opponentScore", { valueAsNumber: true })}
                className="mt-1"
              />
              {errors.opponentScore && (
                <p className="text-sm text-red-500 mt-1">{errors.opponentScore.message}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="opponentName">Opponent Name (Optional)</Label>
            <Input
              id="opponentName"
              {...register("opponentName")}
              className="mt-1"
              placeholder="e.g. City Strikers"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={onComplete}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          form="match-stats-form"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              Saving...
            </>
          ) : (
            "Save Match Result"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
