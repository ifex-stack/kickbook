import { Link, useLocation } from "wouter";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

type SidebarItem = {
  name: string;
  href: string;
  icon: string;
};

const sidebarItems: SidebarItem[] = [
  { name: "Dashboard", href: "/", icon: "dashboard" },
  { name: "Bookings", href: "/bookings", icon: "event" },
  { name: "Team", href: "/team", icon: "groups" },
  { name: "Statistics", href: "/statistics", icon: "analytics" },
  { name: "Achievements", href: "/achievements", icon: "emoji_events" },
  { name: "Subscription", href: "/subscription", icon: "payment" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

interface SidebarProps {
  user: {
    name: string;
    role: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <span className="material-icons text-primary-DEFAULT dark:text-primary-light mr-2">sports_soccer</span>
          <h1 className="text-xl font-heading font-bold text-primary-DEFAULT dark:text-primary-light">KickBook</h1>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <ul>
          {sidebarItems.map((item) => (
            <li key={item.href} className="mb-2">
              <Link href={item.href}>
                <a className={cn(
                  "sidebar-link flex items-center p-3 rounded-lg", 
                  location === item.href 
                    ? "bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:bg-primary-DEFAULT dark:bg-opacity-20 dark:text-primary-light" 
                    : "text-gray-700 dark:text-gray-300 hover:text-primary-DEFAULT dark:hover:text-primary-light"
                )}>
                  <span className="material-icons mr-3">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </a>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:text-primary-light flex items-center justify-center mr-3">
            <span className="font-medium">{user.name.substring(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.role === "admin" ? "Team Admin" : "Player"}</p>
          </div>
        </div>
        
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          <span className="material-icons mr-3 dark:hidden">dark_mode</span>
          <span className="material-icons mr-3 hidden dark:block">light_mode</span>
          <span className="font-medium dark:hidden">Dark Mode</span>
          <span className="font-medium hidden dark:block">Light Mode</span>
        </button>
      </div>
    </aside>
  );
}
