import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";

interface EditPlayerFormData {
  name: string;
  email: string;
  position: string;
  status: string;
  notes: string;
}

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: number | null;
  teamId: number;
}

export function EditPlayerModal({ isOpen, onClose, playerId, teamId }: EditPlayerModalProps) {
  const { toast } = useToast();
  const [position, setPosition] = useState<string>("forward");
  const [status, setStatus] = useState<string>("active");
  
  const { data: playerData, isLoading } = useQuery({
    queryKey: [`/api/players/${playerId}/stats`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: isOpen && !!playerId,
  });
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<EditPlayerFormData>({
    defaultValues: {
      name: "",
      email: "",
      position: "forward",
      status: "active",
      notes: "",
    }
  });
  
  useEffect(() => {
    if (playerData) {
      setValue('name', playerData.player.name);
      setValue('email', playerData.player.email);
      if (playerData.player.position) {
        setValue('position', playerData.player.position);
        setPosition(playerData.player.position);
      }
      if (playerData.player.status) {
        setValue('status', playerData.player.status);
        setStatus(playerData.player.status);
      }
      if (playerData.player.notes) {
        setValue('notes', playerData.player.notes);
      }
    }
  }, [playerData, setValue]);

  const onSubmit = async (data: EditPlayerFormData) => {
    if (!playerId) return;
    
    try {
      await apiRequest("PUT", `/api/players/${playerId}`, data);
      
      toast({
        title: "Player Updated",
        description: "Player information has been updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/members`] });
      queryClient.invalidateQueries({ queryKey: [`/api/players/${playerId}/stats`] });
      reset();
      onClose();
    } catch (error) {
      console.error("Error updating player:", error);
      toast({
        title: "Error",
        description: "Failed to update player. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-medium text-gray-900 dark:text-gray-100">Edit Player</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="player-name">Player Name</Label>
              <Input 
                id="player-name" 
                {...register("name", { required: "Name is required" })}
                className="mt-1"
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="player-email">Email</Label>
              <Input 
                id="player-email" 
                type="email" 
                {...register("email", { 
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
                className="mt-1"
              />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="player-position">Position</Label>
              <Select 
                onValueChange={(value) => {
                  setPosition(value);
                  register("position").onChange({ target: { value } });
                }}
                value={position}
              >
                <SelectTrigger id="player-position" className="w-full mt-1">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                  <SelectItem value="defender">Defender</SelectItem>
                  <SelectItem value="midfielder">Midfielder</SelectItem>
                  <SelectItem value="forward">Forward</SelectItem>
                </SelectContent>
              </Select>
              {errors.position && <p className="text-sm text-red-500 mt-1">{errors.position.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="player-status">Status</Label>
              <Select 
                onValueChange={(value) => {
                  setStatus(value);
                  register("status").onChange({ target: { value } });
                }}
                value={status}
              >
                <SelectTrigger id="player-status" className="w-full mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="injury">Injured</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-red-500 mt-1">{errors.status.message}</p>}
            </div>
            
            <div>
              <Label htmlFor="player-notes">Notes</Label>
              <Textarea 
                id="player-notes" 
                rows={3} 
                {...register("notes")}
                className="mt-1"
              />
            </div>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
