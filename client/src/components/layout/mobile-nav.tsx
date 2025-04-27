import { Link, useLocation } from "wouter";

const navItems = [
  { name: "Dashboard", href: "/", icon: "dashboard" },
  { name: "Bookings", href: "/bookings", icon: "event" },
  { name: "Team", href: "/team", icon: "groups" },
  { name: "More", href: "/more", icon: "menu" },
];

export function MobileNav() {
  const [location] = useLocation();

  return (
    <nav className="lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 inset-x-0 z-10">
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
              <span className="material-icons">{item.icon}</span>
              <span className="text-xs mt-1">{item.name}</span>
            </a>
          </Link>
        ))}
      </div>
    </nav>
  );
}
