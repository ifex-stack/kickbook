import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { useTheme } from "@/lib/theme";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { CalendarIntegration } from "@/components/settings/calendar-integration";

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [teamForm, setTeamForm] = useState({
    name: "",
    location: "",
    primaryColor: "#2E7D32", // Default green from design
  });
  
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    matchReminders: true,
    statsUpdates: true,
    teamAnnouncements: true,
  });
  
  const handleProfileFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleTeamFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTeamForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNotificationChange = (name: string, checked: boolean) => {
    setNotifications(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleSaveProfile = async () => {
    try {
      setIsUpdating(true);
      
      // Validate password fields
      if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords don't match",
          variant: "destructive",
        });
        return;
      }
      
      // Only send necessary fields
      const data: any = { name: profileForm.name, email: profileForm.email };
      
      // Only include password fields if changing password
      if (profileForm.currentPassword && profileForm.newPassword) {
        data.currentPassword = profileForm.currentPassword;
        data.newPassword = profileForm.newPassword;
      }
      
      await apiRequest("PUT", `/api/users/${user?.id}`, data);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
      
      // Clear password fields
      setProfileForm(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      
      // Invalidate user data cache to refresh
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleSaveTeam = async () => {
    try {
      setIsUpdating(true);
      
      await apiRequest("PUT", `/api/teams/${user?.teamId}`, teamForm);
      
      toast({
        title: "Team Updated",
        description: "Team settings have been successfully updated",
      });
      
      // Invalidate team data cache to refresh
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${user?.teamId}`] });
      
    } catch (error) {
      console.error("Error updating team:", error);
      toast({
        title: "Error",
        description: "Failed to update team settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleSaveNotifications = async () => {
    try {
      setIsUpdating(true);
      
      await apiRequest("PUT", `/api/users/${user?.id}/notifications`, notifications);
      
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved",
      });
      
    } catch (error) {
      console.error("Error updating notifications:", error);
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <AppShell user={{ name: user?.name || "User", role: user?.role || "player" }}>
      <PageHeader 
        title="Settings" 
        description="Manage your account and preferences"
      />
      
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none p-0">
              <TabsTrigger 
                value="profile" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-DEFAULT py-3 px-6"
              >
                Profile
              </TabsTrigger>
              {user?.role === "admin" && (
                <TabsTrigger 
                  value="team" 
                  className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-DEFAULT py-3 px-6"
                >
                  Team
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="notifications" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-DEFAULT py-3 px-6"
              >
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-DEFAULT py-3 px-6"
              >
                Calendar
              </TabsTrigger>
              <TabsTrigger 
                value="appearance" 
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-DEFAULT py-3 px-6"
              >
                Appearance
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="p-6 space-y-6 focus:outline-none">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Personal Information</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your personal details</p>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileFormChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileForm.email}
                      onChange={handleProfileFormChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Security</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your password</p>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={handleProfileFormChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={profileForm.newPassword}
                      onChange={handleProfileFormChange}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={handleProfileFormChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleLogout}>
                  Sign Out
                </Button>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="team" className="p-6 space-y-6 focus:outline-none">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Team Settings</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your team's information</p>
                
                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                      id="teamName"
                      name="name"
                      value={teamForm.name}
                      onChange={handleTeamFormChange}
                      className="mt-1"
                      placeholder="e.g. Football Stars"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="teamLocation">Home Location</Label>
                    <Input
                      id="teamLocation"
                      name="location"
                      value={teamForm.location}
                      onChange={handleTeamFormChange}
                      className="mt-1"
                      placeholder="e.g. Central Park Fields"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="teamColor">Team Primary Color</Label>
                    <div className="flex mt-1">
                      <Input
                        id="teamColor"
                        name="primaryColor"
                        type="color"
                        value={teamForm.primaryColor}
                        onChange={handleTeamFormChange}
                        className="w-12 h-10 p-1 mr-3"
                      />
                      <Input
                        name="primaryColor"
                        value={teamForm.primaryColor}
                        onChange={handleTeamFormChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveTeam}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Team Settings"
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications" className="p-6 space-y-6 focus:outline-none">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Notification Preferences</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Control how you receive notifications</p>
                
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationChange("emailNotifications", checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="pushNotifications">Push Notifications</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications on your device</p>
                    </div>
                    <Switch
                      id="pushNotifications"
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => handleNotificationChange("pushNotifications", checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="matchReminders">Match Reminders</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Get reminded about upcoming matches</p>
                    </div>
                    <Switch
                      id="matchReminders"
                      checked={notifications.matchReminders}
                      onCheckedChange={(checked) => handleNotificationChange("matchReminders", checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="statsUpdates">Stats Updates</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates when match stats are recorded</p>
                    </div>
                    <Switch
                      id="statsUpdates"
                      checked={notifications.statsUpdates}
                      onCheckedChange={(checked) => handleNotificationChange("statsUpdates", checked)}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="teamAnnouncements">Team Announcements</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Receive important team announcements</p>
                    </div>
                    <Switch
                      id="teamAnnouncements"
                      checked={notifications.teamAnnouncements}
                      onCheckedChange={(checked) => handleNotificationChange("teamAnnouncements", checked)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveNotifications}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Notification Settings"
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="calendar" className="p-6 space-y-6 focus:outline-none">
              {/* Import CalendarIntegration component */}
              {user && <CalendarIntegration userId={user.id} />}
            </TabsContent>
            
            <TabsContent value="appearance" className="p-6 space-y-6 focus:outline-none">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Theme</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Customize the app appearance</p>
                
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card 
                    className={`cursor-pointer ${theme === "light" ? "ring-2 ring-primary-DEFAULT" : ""}`}
                    onClick={() => setTheme("light")}
                  >
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="w-full h-24 bg-white border border-gray-200 rounded-md mb-3 flex items-center justify-center">
                        <span className="material-icons text-gray-900">light_mode</span>
                      </div>
                      <p className="text-sm font-medium">Light</p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer ${theme === "dark" ? "ring-2 ring-primary-DEFAULT" : ""}`}
                    onClick={() => setTheme("dark")}
                  >
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="w-full h-24 bg-gray-900 border border-gray-700 rounded-md mb-3 flex items-center justify-center">
                        <span className="material-icons text-gray-100">dark_mode</span>
                      </div>
                      <p className="text-sm font-medium">Dark</p>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer ${theme === "system" ? "ring-2 ring-primary-DEFAULT" : ""}`}
                    onClick={() => setTheme("system")}
                  >
                    <CardContent className="p-4 flex flex-col items-center">
                      <div className="w-full h-24 bg-gradient-to-r from-white to-gray-900 border border-gray-200 rounded-md mb-3 flex items-center justify-center">
                        <span className="material-icons text-gray-700">devices</span>
                      </div>
                      <p className="text-sm font-medium">System</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AppShell>
  );
}
