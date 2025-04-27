import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { AchievementCard } from "@/components/achievements/achievement-card";
import { AchievementProgress } from "@/components/achievements/achievement-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";

// Types for achievements
interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  points: number;
  isEarned?: boolean;
  earnedAt?: string;
  progress?: number;
}

export default function Achievements() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("earned");
  
  // Fetch all achievements
  const { data: allAchievements, isLoading: isLoadingAchievements } = useQuery({
    queryKey: ["/api/achievements"],
    queryFn: undefined, // Using the default query function from queryClient
  });
  
  // Fetch player's achievements
  const { data: playerAchievements, isLoading: isLoadingPlayerAchievements } = useQuery({
    queryKey: [`/api/players/${user?.id}/achievements`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: !!user?.id,
  });
  
  // Combine all achievements with player's earned achievements
  const achievements: Achievement[] = allAchievements ? 
    allAchievements.map((achievement: Achievement) => {
      const earned = playerAchievements?.find((pa: any) => pa.achievement.id === achievement.id);
      return {
        ...achievement,
        isEarned: !!earned,
        earnedAt: earned?.earnedAt,
        // Mock progress for in-progress achievements
        progress: !earned ? Math.floor(Math.random() * 90) : 100
      };
    }) : [];
  
  // Filter achievements based on active tab
  const filteredAchievements = achievements.filter((achievement) => {
    if (activeTab === "earned") {
      return achievement.isEarned;
    } else if (activeTab === "in-progress") {
      return !achievement.isEarned;
    }
    return true;
  });
  
  // Calculate total points earned
  const totalPoints = achievements
    .filter(a => a.isEarned)
    .reduce((sum, achievement) => sum + achievement.points, 0);
  
  // Calculate total available points
  const totalAvailablePoints = achievements.reduce((sum, achievement) => sum + achievement.points, 0);
  
  return (
    <AppShell user={{ name: user?.name || "User", role: user?.role || "player" }}>
      <PageHeader 
        title="Achievements" 
        description="Track your progress and unlock rewards"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AchievementProgress 
                title="Points Earned"
                current={totalPoints}
                max={totalAvailablePoints}
                icon="emoji_events"
              />
              
              <AchievementProgress 
                title="Achievements Unlocked"
                current={achievements.filter(a => a.isEarned).length}
                max={achievements.length}
                icon="stars"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Latest Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPlayerAchievements ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin w-6 h-6 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {achievements
                  .filter(a => a.isEarned)
                  .sort((a, b) => new Date(b.earnedAt || "").getTime() - new Date(a.earnedAt || "").getTime())
                  .slice(0, 3)
                  .map((achievement) => (
                    <div key={achievement.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="p-2 rounded-full bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:text-primary-light mr-3">
                        <span className="material-icons">{achievement.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{achievement.title}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {achievement.earnedAt && new Date(achievement.earnedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-primary-DEFAULT dark:text-primary-light flex items-center">
                        {achievement.points} <span className="material-icons text-sm ml-1">star</span>
                      </div>
                    </div>
                  ))}
                {achievements.filter(a => a.isEarned).length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400">No achievements earned yet</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="earned">Earned</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {isLoadingAchievements || isLoadingPlayerAchievements ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin w-6 h-6 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="earned" className="space-y-4">
              {isLoadingAchievements || isLoadingPlayerAchievements ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin w-6 h-6 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
                </div>
              ) : filteredAchievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredAchievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="material-icons text-4xl text-gray-400 dark:text-gray-600 mb-2">emoji_events</span>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No achievements yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Complete matches and improve your stats to earn achievements
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="in-progress" className="space-y-4">
              {isLoadingAchievements || isLoadingPlayerAchievements ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin w-6 h-6 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
                </div>
              ) : filteredAchievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredAchievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <span className="material-icons text-4xl text-gray-400 dark:text-gray-600 mb-2">check_circle</span>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">All achievements earned!</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Congratulations! You've completed all available achievements
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AppShell>
  );
}
