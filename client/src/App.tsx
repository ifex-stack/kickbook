import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/components/auth/auth-provider";
import NotFound from "@/pages/not-found";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import TeamInvitation from "@/pages/auth/team-invitation";
import Dashboard from "@/pages/dashboard";
import Bookings from "@/pages/bookings";
import Team from "@/pages/team";
import Statistics from "@/pages/statistics";
import Achievements from "@/pages/achievements";
import Subscription from "@/pages/subscription";
import Checkout from "@/pages/checkout";
import Settings from "@/pages/settings";
import More from "@/pages/more";

function Router() {
  return (
    <AuthProvider>
      <Switch>
        {/* Auth routes */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/team-invitation" component={TeamInvitation} />
        
        {/* App routes */}
        <Route path="/" component={Dashboard} />
        <Route path="/bookings" component={Bookings} />
        <Route path="/team" component={Team} />
        <Route path="/statistics" component={Statistics} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/settings" component={Settings} />
        <Route path="/more" component={More} />
        
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </AuthProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
