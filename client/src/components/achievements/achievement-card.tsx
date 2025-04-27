import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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

interface AchievementCardProps {
  achievement: Achievement;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden hover:shadow-md transition-shadow",
      achievement.isEarned ? "border-primary-DEFAULT border-2" : ""
    )}>
      <div className="h-2 bg-primary-DEFAULT"></div>
      <CardContent className="p-4">
        <div className="flex items-start mb-3">
          <div className={cn(
            "p-3 rounded-full mr-3 flex-shrink-0",
            achievement.isEarned 
              ? "bg-primary-DEFAULT text-white" 
              : "bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:text-primary-light"
          )}>
            <span className="material-icons">{achievement.icon}</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{achievement.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{achievement.description}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {achievement.points} points
          </span>
          {achievement.isEarned && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Earned {achievement.earnedAt && new Date(achievement.earnedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        
        {!achievement.isEarned && achievement.progress !== undefined && (
          <div className="space-y-1">
            <Progress value={achievement.progress} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Progress</span>
              <span>{achievement.progress}%</span>
            </div>
          </div>
        )}
        
        {achievement.isEarned && (
          <div className="flex justify-center mt-2">
            <span className="px-2 py-1 bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:text-primary-light text-xs rounded-full flex items-center">
              <span className="material-icons text-sm mr-1">check_circle</span>
              Completed
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
