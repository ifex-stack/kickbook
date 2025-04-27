import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/auth/auth-provider";
import { queryClient } from "@/lib/queryClient";

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
// This is your test publishable API key.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

const CheckoutForm = ({ planName }: { planName: string }) => {
  const { toast } = useToast();
  const stripe = useStripe();
  const elements = useElements();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/subscription?success=true&plan=" + planName,
        },
      });

      if (error) {
        setErrorMessage(error.message || "An unexpected error occurred.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {errorMessage}
        </div>
      )}
      
      <Button 
        type="submit" 
        className="w-full" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </Button>
      
      <p className="text-xs text-gray-500 text-center">
        Your payment is secured by Stripe. We don't store your card details.
      </p>
    </form>
  );
};

export default function Checkout() {
  const { user } = useAuth();
  const [, params] = useRoute('/checkout');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState("");
  const [planName, setPlanName] = useState("pro");

  // Parse URL parameters to get clientSecret and plan name
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const secretParam = searchParams.get("clientSecret");
    const planParam = searchParams.get("plan");
    
    if (secretParam) {
      setClientSecret(secretParam);
    } else {
      toast({
        title: "Error",
        description: "Missing payment information. Please try again.",
        variant: "destructive",
      });
      setLocation("/subscription");
    }
    
    if (planParam) {
      setPlanName(planParam);
    }
  }, [setLocation, toast]);

  const getPlanDetails = () => {
    switch (planName) {
      case "pro":
        return {
          name: "Pro Plan",
          price: "$29/month",
          description: "For serious teams"
        };
      case "enterprise":
        return {
          name: "Enterprise Plan",
          price: "$99/month",
          description: "For clubs & leagues"
        };
      default:
        return {
          name: "Subscription",
          price: "",
          description: "Complete your payment to activate your subscription"
        };
    }
  };

  const planDetails = getPlanDetails();

  // When payment is complete, invalidate subscription data
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("success") === "true") {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      
      toast({
        title: "Payment Successful",
        description: `You have successfully subscribed to the ${planName} plan.`,
      });
      
      // Redirect to subscription page
      setLocation("/subscription");
    }
  }, [setLocation, toast, planName]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0070f3',
    },
  };
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <AppShell user={{ name: user?.name || "User", role: user?.role || "player" }}>
      <div className="max-w-md mx-auto my-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Purchase</CardTitle>
            <CardDescription>Subscribe to {planDetails.name}</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
              <div>
                <h3 className="font-medium">{planDetails.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{planDetails.description}</p>
              </div>
              <div className="text-lg font-semibold">{planDetails.price}</div>
            </div>
            
            {clientSecret && (
              <Elements options={options} stripe={stripePromise}>
                <CheckoutForm planName={planName} />
              </Elements>
            )}
          </CardContent>
          
          <CardFooter className="justify-between flex-col sm:flex-row space-y-2 sm:space-y-0 text-sm text-gray-500">
            <Button variant="ghost" onClick={() => setLocation("/subscription")}>
              Cancel
            </Button>
            <div className="flex items-center">
              <span className="mr-2">Secure payment</span>
              <svg className="h-5 w-5" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                <path fill="#6772e5" d="M32 16c0 8.837-7.163 16-16 16S0 24.837 0 16 7.163 0 16 0s16 7.163 16 16z" />
                <path fill="#fff" d="M13.5 11.5h9a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1zm10-3h-11a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-11a2 2 0 0 0-2-2z" />
              </svg>
            </div>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}