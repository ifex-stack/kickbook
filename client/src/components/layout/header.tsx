import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { Link } from "wouter";

interface HeaderProps {
  onMenuClick: () => void;
  user: {
    name: string;
  };
}

export function Header({ onMenuClick, user }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button and logo */}
          <div className="flex items-center">
            <button 
              type="button" 
              className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
              onClick={onMenuClick}
            >
              <span className="material-icons">menu</span>
            </button>
            <div className="flex-shrink-0 flex items-center ml-4 lg:ml-0">
              <span className="material-icons text-primary-DEFAULT dark:text-primary-light lg:hidden">sports_soccer</span>
              <h1 className="text-xl font-heading font-bold text-primary-DEFAULT dark:text-primary-light ml-2 lg:hidden">KickBook</h1>
            </div>
          </div>

          {/* Search bar (hidden on mobile) */}
          <div className="hidden md:block flex-1 max-w-md ml-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-icons text-gray-400">search</span>
              </div>
              <input 
                type="text" 
                placeholder="Search..." 
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light"
              />
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center">
            <button className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">
              <span className="material-icons">notifications</span>
            </button>
            <button 
              className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none ml-2 lg:hidden" 
              onClick={toggleTheme}
            >
              <span className="material-icons dark:hidden">dark_mode</span>
              <span className="material-icons hidden dark:block">light_mode</span>
            </button>
            <div className="ml-3 relative">
              <button 
                className="flex text-sm rounded-full focus:outline-none lg:hidden"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="w-8 h-8 rounded-full bg-primary-DEFAULT bg-opacity-10 text-primary-DEFAULT dark:text-primary-light flex items-center justify-center">
                  <span className="font-medium">{user.name.substring(0, 2).toUpperCase()}</span>
                </div>
              </button>
              
              {showUserMenu && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <Link href="/settings">
                    <a className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Settings</a>
                  </Link>
                  <Link href="/profile">
                    <a className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Profile</a>
                  </Link>
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      // Logout logic
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
