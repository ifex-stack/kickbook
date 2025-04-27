import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SubscriptionModal } from "@/components/subscription/subscription-modal";
import { useAuth } from "@/components/auth/auth-provider";
import { useQuery } from "@tanstack/react-query";

export default function Subscription() {
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Get team subscription details
  const { data: team, isLoading } = useQuery({
    queryKey: [`/api/teams/${user?.teamId}`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: !!user?.teamId,
  });
  
  // Get team billing history
  const { data: billingHistory, isLoading: isLoadingBilling } = useQuery({
    queryKey: [`/api/teams/${user?.teamId}/billing`],
    queryFn: undefined, // Using the default query function from queryClient
    enabled: !!user?.teamId,
  });
  
  // Plan details
  const plans = {
    basic: {
      name: "Basic",
      description: "For casual teams",
      price: "Free",
      features: [
        { name: "1 team (max 11 players)", included: true },
        { name: "Core booking features", included: true },
        { name: "Email support", included: true },
        { name: "Advanced stats tracking", included: false },
        { name: "Fantasy league features", included: false },
        { name: "Multi-team management", included: false },
      ]
    },
    pro: {
      name: "Pro",
      description: "For serious teams",
      price: "$29/month",
      features: [
        { name: "Unlimited players", included: true },
        { name: "Post-match stats tracking", included: true },
        { name: "Points & leaderboards", included: true },
        { name: "Simple fantasy league", included: true },
        { name: "Phone & email support", included: true },
        { name: "Multi-team management", included: false },
      ]
    },
    enterprise: {
      name: "Enterprise",
      description: "For clubs & leagues",
      price: "$99/month",
      features: [
        { name: "Everything in Pro", included: true },
        { name: "Multi-team management", included: true },
        { name: "Advanced analytics", included: true },
        { name: "White-label branding", included: true },
        { name: "Priority support", included: true },
        { name: "API access", included: true },
      ]
    }
  };
  
  // Get current plan based on subscription
  const currentPlan = team?.subscription ? plans[team.subscription as keyof typeof plans] : plans.basic;
  
  // Mock billing history for UI demonstration
  const dummyBillingHistory = [
    { id: 1, date: "2023-09-01", amount: "$29.00", status: "Paid", description: "Pro Plan - Monthly" },
    { id: 2, date: "2023-08-01", amount: "$29.00", status: "Paid", description: "Pro Plan - Monthly" },
    { id: 3, date: "2023-07-01", amount: "$29.00", status: "Paid", description: "Pro Plan - Monthly" },
  ];
  
  return (
    <AppShell user={{ name: user?.name || "User", role: user?.role || "player" }}>
      <PageHeader 
        title="Subscription" 
        description="Manage your subscription and billing information"
        actions={
          user?.role === "admin" && (
            <Button onClick={() => setShowUpgradeModal(true)}>
              Upgrade Plan
            </Button>
          )
        }
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your team's current subscription plan and features</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin w-6 h-6 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {currentPlan.name}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">{currentPlan.description}</p>
                  </div>
                  <Badge variant="outline" className="text-primary-DEFAULT border-primary-DEFAULT">
                    Current Plan
                  </Badge>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Included Features</h4>
                  <ul className="space-y-2">
                    {currentPlan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <span className={`material-icons text-sm mr-2 ${feature.included ? 'text-success' : 'text-gray-400 dark:text-gray-600'}`}>
                          {feature.included ? 'check_circle' : 'cancel'}
                        </span>
                        <span className={feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Price</h4>
                      <p className="text-xl font-semibold mt-1">{currentPlan.price}</p>
                    </div>
                    {user?.role === "admin" && (
                      <Button variant="outline" onClick={() => setShowUpgradeModal(true)}>
                        Change Plan
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            {team?.subscription === "basic" ? (
              <div className="text-center py-4">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No payment method required for the Basic plan</p>
                {user?.role === "admin" && (
                  <Button onClick={() => setShowUpgradeModal(true)}>
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 mr-3">
                    <span className="material-icons">credit_card</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">**** **** **** 4242</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Expires 12/2025</p>
                  </div>
                  {user?.role === "admin" && (
                    <Button variant="ghost" size="sm" className="ml-auto">
                      <span className="material-icons text-sm">edit</span>
                    </Button>
                  )}
                </div>
                
                {user?.role === "admin" && (
                  <Button variant="outline" className="w-full">
                    <span className="material-icons text-sm mr-2">add</span>
                    Add Payment Method
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Only show billing history for paid plans */}
      {team?.subscription !== "basic" && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBilling ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin w-6 h-6 border-4 border-primary-DEFAULT border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {(billingHistory || dummyBillingHistory).map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {new Date(item.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {item.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.status === "Paid" 
                              ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button variant="ghost" size="sm">
                            <span className="material-icons text-sm">receipt</span>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
            <p>Showing recent transactions</p>
            <Button variant="link" size="sm" className="text-primary-DEFAULT dark:text-primary-light">
              View all
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <SubscriptionModal 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </AppShell>
  );
}
