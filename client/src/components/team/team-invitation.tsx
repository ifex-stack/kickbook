import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CopyIcon, LinkIcon, MailIcon, ShareIcon, CheckIcon, Settings2Icon } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

interface TeamInvitationProps {
  teamId: number;
  teamName: string;
}

export function TeamInvitation({ teamId, teamName }: TeamInvitationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [allowPlayerRegistration, setAllowPlayerRegistration] = useState(true);
  const [allowPlayerBookingManagement, setAllowPlayerBookingManagement] = useState(false);

  // Generate invite link when component mounts
  useState(() => {
    const baseUrl = window.location.origin;
    setInviteLink(`${baseUrl}/register?teamId=${teamId}&teamName=${encodeURIComponent(teamName)}`);
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    
    toast({
      title: "Link copied to clipboard",
      description: "You can now share this link with your team members",
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleSavePermissions = () => {
    // Here we would make an API call to update team settings
    // For now we just show a success message
    toast({
      title: "Team settings updated",
      description: "Player permissions have been updated successfully",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-heading">Team Sharing & Invitations</CardTitle>
        <CardDescription>
          Invite players to join your team and manage their access to features
        </CardDescription>
      </CardHeader>

      <Tabs defaultValue="invite" className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-4">
          <TabsTrigger value="invite" className="text-center">
            <LinkIcon className="w-4 h-4 mr-2" />
            Invite Players
          </TabsTrigger>
          <TabsTrigger value="permissions" className="text-center">
            <Settings2Icon className="w-4 h-4 mr-2" />
            Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invite" className="space-y-4 px-6">
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/20 p-2 rounded-full">
                <ShareIcon className="text-primary h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Share with your team</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Players can register themselves and join your team using this link
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-link">Team Invitation Link</Label>
            <div className="flex gap-2">
              <Input
                id="team-link"
                value={inviteLink}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className={copied ? "text-green-600 border-green-600" : ""}
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4" />
                ) : (
                  <CopyIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex justify-between">
              <Button variant="default" className="gap-2">
                <MailIcon className="h-4 w-4" />
                Send Email Invitations
              </Button>
              
              <Button variant="outline" className="gap-2">
                <ShareIcon className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4 px-6">
          <div className="bg-secondary/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/20 p-2 rounded-full">
                <Settings2Icon className="text-primary h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Player Permissions</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Control what features and data players can access in your team
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Allow Player Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Players can register themselves using the invitation link
                </p>
              </div>
              <Switch
                checked={allowPlayerRegistration}
                onCheckedChange={setAllowPlayerRegistration}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Allow Booking Management</Label>
                <p className="text-sm text-muted-foreground">
                  Players can view and register for available booking slots
                </p>
              </div>
              <Switch
                checked={allowPlayerBookingManagement}
                onCheckedChange={setAllowPlayerBookingManagement}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <CardFooter className="flex justify-end px-6 py-4 border-t mt-4">
        <Button variant="outline" className="mr-2">
          Cancel
        </Button>
        <Button onClick={handleSavePermissions}>
          Save Settings
        </Button>
      </CardFooter>
    </Card>
  );
}