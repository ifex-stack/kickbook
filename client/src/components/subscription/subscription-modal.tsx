import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionPlan {
  name: string;
  description: string;
  price: string | number;
  features: string[];
  isPopular?: boolean;
  isCurrent?: boolean;
  ctaText: string;
  priceId?: string;
  onSelect: () => void;
}

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

export function SubscriptionModal({ isOpen, onClose, currentPlan = "basic" }: SubscriptionModalProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // These price IDs come from your Stripe dashboard
  // You need to get these from your Stripe dashboard by creating products and prices
  const STRIPE_PRICE_IDS = {
    // Use actual price IDs from your Stripe dashboard for production
    pro: "price_1OtEVDBfccWQRlJhvMb2KMNS", // Pro plan price ID
    enterprise: "price_1OtEVjBfccWQRlJhkArbXtEF" // Enterprise plan price ID
  };

  // Handle subscription upgrade
  const handleSubscription = async (planName: string, priceId?: string) => {
    if (planName === "basic" || !priceId) {
      // Free plan, just close the modal
      toast({
        title: "Plan Updated",
        description: "You're now on the Basic plan.",
      });
      onClose();
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Call our backend to create a subscription
      const response = await apiRequest("POST", "/api/get-or-create-subscription", {
        priceId: priceId
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create subscription");
      }
      
      const data = await response.json();
      
      if (data.clientSecret) {
        // Redirect to checkout page
        setLocation(`/checkout?clientSecret=${data.clientSecret}&plan=${planName}`);
      } else {
        toast({
          title: "Subscription Active",
          description: `Your ${planName} plan is already active.`,
        });
      }
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Subscription Error",
        description: error.message || "An error occurred while processing your subscription",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      name: "Basic",
      description: "For casual teams",
      price: "Free",
      features: [
        "1 team (max 11 players)",
        "Core booking features",
        "Email support"
      ],
      isCurrent: currentPlan === "basic",
      ctaText: currentPlan === "basic" ? "Current Plan" : "Downgrade to Basic",
      onSelect: () => {
        handleSubscription("basic");
      }
    },
    {
      name: "Pro",
      description: "For competitive teams",
      price: "$29",
      features: [
        "Unlimited players",
        "Post-match stats tracking",
        "Points & leaderboards",
        "Simple fantasy league",
        "Premium email support"
      ],
      isPopular: true,
      isCurrent: currentPlan === "pro",
      priceId: STRIPE_PRICE_IDS.pro,
      ctaText: currentPlan === "pro" ? "Current Plan" : "Upgrade to Pro",
      onSelect: () => {
        handleSubscription("pro", STRIPE_PRICE_IDS.pro);
      }
    },
    {
      name: "Enterprise",
      description: "For clubs & leagues",
      price: "$99",
      features: [
        "Everything in Pro",
        "Multi-team management",
        "Advanced analytics",
        "White-label branding",
        "Priority support"
      ],
      isCurrent: currentPlan === "enterprise",
      priceId: STRIPE_PRICE_IDS.enterprise,
      ctaText: currentPlan === "enterprise" ? "Current Plan" : "Upgrade to Enterprise",
      onSelect: () => {
        handleSubscription("enterprise", STRIPE_PRICE_IDS.enterprise);
      }
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader className="text-center pb-6">
          <DialogTitle className="text-3xl font-heading font-bold text-gray-900 dark:text-gray-100">Choose Your Perfect Plan</DialogTitle>
          <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
            Select the plan that best fits your team's needs. All plans include core booking features.
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan, index) => (
            <div 
              key={index}
              className={`relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ${
                plan.isPopular 
                  ? 'border-2 border-primary dark:border-primary scale-105 transform' 
                  : 'border border-gray-200 dark:border-gray-700'
                } rounded-xl p-6 bg-white dark:bg-gray-800`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-white text-sm font-medium text-center py-1.5 shadow-md">
                  MOST POPULAR
                </div>
              )}
              
              <div className={plan.isPopular ? "pt-6" : ""}>
                {plan.isCurrent && (
                  <div className="absolute top-2 right-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded-full font-medium">
                    Current Plan
                  </div>
                )}
                
                <h4 className="text-xl font-heading font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {plan.name}
                </h4>
                
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 h-10">
                  {plan.description}
                </p>
                
                <div className="mb-6 flex items-end">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {plan.price}
                  </span>
                  {typeof plan.price !== "string" && 
                    <span className="text-gray-500 dark:text-gray-400 ml-1 mb-1">/month</span>
                  }
                </div>
                
                <div className="border-t border-b border-gray-100 dark:border-gray-700 py-4 mb-6">
                  <h5 className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">
                    What's included:
                  </h5>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <span className="text-primary dark:text-primary flex-shrink-0 mr-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button
                  onClick={plan.onSelect}
                  variant={plan.isPopular ? "default" : "outline"}
                  className={`w-full py-6 font-semibold text-md ${
                    plan.isPopular 
                      ? 'bg-primary hover:bg-primary/90 text-white shadow-lg' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  disabled={plan.isCurrent || isProcessing}
                >
                  {isProcessing && plan.ctaText !== "Current Plan" ? "Processing..." : plan.ctaText}
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <DialogFooter className="px-6 py-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg mt-4">
          <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <span className="bg-green-100 p-2 rounded-full mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </span>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Secure Payment</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Your data is protected with 256-bit SSL encryption</p>
              </div>
            </div>
            
            <div className="flex flex-col text-center md:text-right">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                All plans include a 14-day free trial.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center md:justify-end">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <a href="#" className="text-primary hover:underline ml-1">
                  View terms and conditions
                </a>
              </p>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}