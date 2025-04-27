import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Icons } from "@/components/ui/icons";
import { Check, Copy, Share2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TeamInvitationProps {
  teamId: number;
}

export function TeamInvitation({ teamId }: TeamInvitationProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [`/api/teams/${teamId}/invitation`],
    retry: false,
  });

  const regenerateInvitationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/teams/${teamId}/invitation/regenerate`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to regenerate invitation code');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/invitation`] });
      toast({
        title: "Invitation Regenerated",
        description: "New invitation code has been generated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to regenerate invitation code",
        variant: "destructive",
      });
    }
  });

  const handleCopyToClipboard = () => {
    if (!data?.invitationCode) return;
    
    const inviteUrl = `${window.location.origin}/team-invitation?code=${data.invitationCode}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Invitation link has been copied to clipboard",
      });
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };

  const handleShareInvitation = () => {
    if (!data?.invitationCode) return;
    
    const inviteUrl = `${window.location.origin}/team-invitation?code=${data.invitationCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Join ${data.teamName} Team`,
        text: `You have been invited to join ${data.teamName} Team. Click the link to register.`,
        url: inviteUrl,
      }).catch((error) => {
        console.error('Error sharing:', error);
      });
    } else {
      handleCopyToClipboard();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Invitation</CardTitle>
        <CardDescription>
          Generate and share invitation links for new players to join your team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data?.invitationCode ? (
          <>
            <Alert>
              <AlertTitle>Invitation Link</AlertTitle>
              <AlertDescription className="mt-2">
                Share this link with players you want to invite to your team
              </AlertDescription>
            </Alert>
            <div className="flex items-center space-x-2">
              <Input
                readOnly
                value={`${window.location.origin}/team-invitation?code=${data.invitationCode}`}
                className="flex-1"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyToClipboard}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={handleShareInvitation}
                className="shrink-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              {isLoading ? "Loading invitation code..." : "No invitation code found. Generate one to invite players."}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => regenerateInvitationMutation.mutate()}
          disabled={regenerateInvitationMutation.isPending}
          className="w-full"
        >
          {regenerateInvitationMutation.isPending ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>Regenerate Invitation Code</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}