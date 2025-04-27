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
  
  // These price IDs would come from your Stripe dashboard
  // For this template, we're using placeholder IDs
  const STRIPE_PRICE_IDS = {
    pro: "price_pro",
    enterprise: "price_enterprise"
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
      description: "For serious teams",
      price: "$29",
      features: [
        "Unlimited players",
        "Post-match stats tracking",
        "Points & leaderboards",
        "Simple fantasy league",
        "Phone & email support"
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-heading font-medium text-gray-900 dark:text-gray-100">Choose Your Subscription Plan</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {subscriptionPlans.map((plan, index) => (
            <div 
              key={index}
              className={`border ${plan.isPopular ? 'border-2 border-primary dark:border-primary' : 'border-gray-200 dark:border-gray-700'} rounded-lg p-6 bg-white dark:bg-gray-800 relative`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  POPULAR
                </div>
              )}
              <h4 className="text-lg font-heading font-medium text-gray-900 dark:text-gray-100 mb-2">{plan.name}</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                {typeof plan.price !== "string" && <span className="text-gray-500 dark:text-gray-400">/month</span>}
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <span className="material-icons text-success mr-2 flex-shrink-0">check_circle</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={plan.onSelect}
                variant={plan.isCurrent ? "outline" : plan.isPopular ? "default" : "outline"}
                className={`w-full ${plan.name === "Enterprise" ? 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600' : ''}`}
              >
                {plan.ctaText}
              </Button>
            </div>
          ))}
        </div>
        
        <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
          All plans include a 14-day free trial. No credit card required to start.
          <a href="#" className="text-primary hover:text-primary dark:text-primary dark:hover:text-primary ml-1">
            Learn more
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}