import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    name: string;
    role: string;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar user={user} />
      
      {/* Mobile menu overlay */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}
      
      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 lg:hidden">
          <Sidebar user={user} />
        </div>
      )}
      
      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          onMenuClick={() => setShowMobileMenu(true)} 
          user={user}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 pb-20 lg:pb-6">
          {children}
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
