import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface AddPlayerFormData {
  name: string;
  email: string;
  position: string;
  status: string;
  notes: string;
}

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: number;
  onSuccess: () => void;
}

export function AddPlayerModal({ isOpen, onClose, teamId, onSuccess }: AddPlayerModalProps) {
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddPlayerFormData>({
    defaultValues: {
      name: "",
      email: "",
      position: "",
      status: "active",
      notes: "",
    }
  });
  
  const [position, setPosition] = useState("forward");
  const [status, setStatus] = useState("active");

  const onSubmit = async (data: AddPlayerFormData) => {
    try {
      await apiRequest("POST", `/api/teams/${teamId}/members`, {
        name: data.name,
        email: data.email,
        position: data.position,
        status: data.status,
        notes: data.notes,
      });
      
      toast({
        title: "Success",
        description: "Player added successfully",
      });
      
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error adding player:", error);
      toast({
        title: "Error",
        description: "Failed to add player. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-medium text-gray-900 dark:text-gray-100">Add New Player</DialogTitle>
        </DialogHeader>
        
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
              defaultValue={position}
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
              defaultValue={status}
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
              Add Player
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
