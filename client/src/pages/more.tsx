import { Link } from "wouter";
import { 
  Trophy, Settings, CreditCard, BarChart2, LogOut, UserCog, HelpCircle, MessagesSquare, 
  Heart, Bell, Gift, Info, ChevronRight
} from "lucide-react";

import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function More() {
  // Menu sections for better organization
  const menuSections = [
    {
      title: "Account",
      items: [
        { name: "Subscription", href: "/subscription", icon: <CreditCard size={20} /> },
        { name: "Settings", href: "/settings", icon: <Settings size={20} /> },
      ]
    },
    {
      title: "Activity",
      items: [
        { name: "Statistics", href: "/statistics", icon: <BarChart2 size={20} /> },
        { name: "Achievements", href: "/achievements", icon: <Trophy size={20} /> },
      ]
    },
    {
      title: "Support",
      items: [
        { name: "Help Center", href: "/help", icon: <HelpCircle size={20} /> },
        { name: "Contact Support", href: "/contact", icon: <MessagesSquare size={20} /> },
        { name: "About KickBook", href: "/about", icon: <Info size={20} /> },
      ]
    }
  ];

  return (
    <ScrollArea className="h-[calc(100vh-5rem)] container px-4 pt-6 pb-32">
      <div className="space-y-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>More Options</CardTitle>
            <CardDescription>Access additional features and settings</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {menuSections.map((section, index) => (
              <div key={section.title}>
                {index > 0 && <Separator />}
                <div className="px-6 py-2 text-sm font-medium text-muted-foreground">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <a className="block">
                        <div className="flex items-center px-6 py-3 hover:bg-accent rounded-lg transition-colors cursor-pointer">
                          <div className="flex items-center flex-1 gap-3">
                            <div className="text-primary">{item.icon}</div>
                            <span>{item.name}</span>
                          </div>
                          <ChevronRight size={16} className="text-muted-foreground" />
                        </div>
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Button 
              variant="outline" 
              className="w-full border-destructive text-destructive hover:bg-destructive/10"
              onClick={() => window.location.href = "/api/auth/logout"}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}