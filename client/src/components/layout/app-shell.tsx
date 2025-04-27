import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Calendar, 
  Users, 
  BarChart, 
  Award, 
  CreditCard, 
  Settings, 
  Menu, 
  X, 
  LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/components/auth/auth-provider";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  isPro?: boolean;
}

interface AppShellProps {
  children: ReactNode;
  user?: {
    name: string;
    role: string;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  const [location] = useLocation();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  // Navigation items for sidebar/navbar
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Bookings",
      href: "/bookings",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Team",
      href: "/team",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Statistics",
      href: "/statistics",
      icon: <BarChart className="h-5 w-5" />,
      isPro: true,
    },
    {
      title: "Achievements",
      href: "/achievements",
      icon: <Award className="h-5 w-5" />,
    },
    {
      title: "Credits",
      href: "/credits",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden fixed top-4 left-4 z-40"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <MobileNav 
            items={navItems} 
            currentPath={location} 
            onNavItemClick={() => setIsOpen(false)}
            onLogout={logout}
            userName={user?.name || "User"}
            userRole={user?.role || "player"}
          />
        </SheetContent>
      </Sheet>
      
      {/* Desktop Navigation */}
      <div className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-50">
        <SideNav 
          items={navItems} 
          currentPath={location} 
          onLogout={logout}
          userName={user?.name || "User"}
          userRole={user?.role || "player"}
        />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}

function SideNav({ 
  items, 
  currentPath,
  onLogout,
  userName,
  userRole
}: { 
  items: NavItem[];
  currentPath: string;
  onLogout: () => void;
  userName: string;
  userRole: string;
}) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950 border-r">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold">KB</span>
            </div>
            <span className="font-bold text-xl">KickBook</span>
          </div>
        </Link>
      </div>
      
      {/* User Info */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="font-medium">{userName}</div>
            <div className="text-xs text-muted-foreground capitalize">{userRole}</div>
          </div>
        </div>
      </div>
      
      {/* Menu Items */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-1">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={`
                flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
                ${currentPath === item.href 
                  ? 'bg-primary text-white' 
                  : 'text-foreground hover:bg-muted'
                }
              `}>
                {item.icon}
                <span>{item.title}</span>
                {item.isPro && (
                  <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 px-1.5 py-0.5 rounded">
                    PRO
                  </span>
                )}
              </a>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      
      {/* Logout */}
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

function MobileNav({ 
  items, 
  currentPath, 
  onNavItemClick,
  onLogout,
  userName,
  userRole
}: { 
  items: NavItem[]; 
  currentPath: string;
  onNavItemClick: () => void;
  onLogout: () => void;
  userName: string;
  userRole: string;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold">KB</span>
            </div>
            <span className="font-bold text-xl">KickBook</span>
          </div>
        </Link>
      </div>
      
      {/* User Info */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="font-medium">{userName}</div>
            <div className="text-xs text-muted-foreground capitalize">{userRole}</div>
          </div>
        </div>
      </div>
      
      {/* Menu Items */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-1">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <a 
                className={`
                  flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
                  ${currentPath === item.href 
                    ? 'bg-primary text-white' 
                    : 'text-foreground hover:bg-muted'
                  }
                `}
                onClick={onNavItemClick}
              >
                {item.icon}
                <span>{item.title}</span>
                {item.isPro && (
                  <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 px-1.5 py-0.5 rounded">
                    PRO
                  </span>
                )}
              </a>
            </Link>
          ))}
        </nav>
      </ScrollArea>
      
      {/* Logout */}
      <div className="p-4 border-t">
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={() => {
            onNavItemClick();
            onLogout();
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}