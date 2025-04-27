import { Progress } from "@/components/ui/progress";

interface AchievementProgressProps {
  title: string;
  current: number;
  max: number;
  icon: string;
}

export function AchievementProgress({ title, current, max, icon }: AchievementProgressProps) {
  const percentage = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="material-icons text-primary-DEFAULT dark:text-primary-light mr-2">
            {icon}
          </span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {current} / {max}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
      <div className="flex justify-end">
        <span className="text-xs text-gray-500 dark:text-gray-400">{percentage}% complete</span>
      </div>
    </div>
  );
}
