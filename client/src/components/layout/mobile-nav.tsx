import { Link, useLocation } from "wouter";
import { LayoutDashboard, Calendar, Users, Menu } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: <LayoutDashboard size={24} /> },
  { name: "Bookings", href: "/bookings", icon: <Calendar size={24} /> },
  { name: "Team", href: "/team", icon: <Users size={24} /> },
  { name: "More", href: "/more", icon: <Menu size={24} /> },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 fixed bottom-0 inset-x-0 z-10">
      <div className="flex justify-around h-16">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a 
              className={`flex flex-col items-center justify-center w-full ${
                location === item.href
                  ? "text-primary-DEFAULT dark:text-primary-light"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <div className="mb-1">{item.icon}</div>
              <span className="text-xs">{item.name}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}
