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
      <div className="space-y-5">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          <PaymentElement />
        </div>
        
        {errorMessage && (
          <div className="flex items-start p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
            <div className="mr-3 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>{errorMessage}</div>
          </div>
        )}
        
        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full py-6 text-base font-semibold bg-primary hover:bg-primary/90"
            disabled={!stripe || isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                Complete Subscription
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            )}
          </Button>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <div className="flex items-center justify-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mr-2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Secure SSL Encryption</span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          By clicking the button above, you agree to our Terms of Service and authorize us to charge your card until you cancel.
        </p>
      </div>
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
          description: "For competitive teams"
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
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#0070f3',
    },
  } as const;
  const options = {
    clientSecret,
    appearance,
  };

  return (
    <AppShell user={{ name: user?.name || "User", role: user?.role || "player" }}>
      <div className="max-w-4xl mx-auto my-10 px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Left side - Order Summary */}
          <div className="md:col-span-2">
            <div className="sticky top-24">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-primary/5 dark:bg-primary/10 rounded-t-lg border-b">
                  <CardTitle className="text-xl font-bold">Order Summary</CardTitle>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{planDetails.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{planDetails.description}</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600 dark:text-gray-400">Subscription</span>
                        <span>{planDetails.price}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Billing</span>
                        <span>Monthly</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="text-lg">{planDetails.price}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Includes all applicable taxes
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                      <div className="flex">
                        <div className="text-blue-600 dark:text-blue-400 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Free Trial Included</h4>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Your subscription includes a 14-day free trial. You can cancel anytime during this period.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="border-t bg-gray-50 dark:bg-gray-800 rounded-b-lg flex justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setLocation("/subscription")}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                  </Button>
                  
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    Secure Checkout
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
          
          {/* Right side - Payment form */}
          <div className="md:col-span-3">
            <Card className="border-0 shadow-lg">
              <CardHeader className="border-b">
                <CardTitle className="text-xl font-bold">Payment Details</CardTitle>
                <CardDescription>
                  Complete your subscription to {planDetails.name}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-6">
                {clientSecret ? (
                  <Elements options={options} stripe={stripePromise}>
                    <CheckoutForm planName={planName} />
                  </Elements>
                ) : (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50 dark:bg-gray-800 flex flex-col text-center py-4">
                <div className="flex justify-center space-x-4 mb-2">
                  <img src="https://www.svgrepo.com/show/328132/visa.svg" alt="Visa" className="h-6 w-10 opacity-70" />
                  <img src="https://www.svgrepo.com/show/328125/mastercard.svg" alt="Mastercard" className="h-6 w-10 opacity-70" />
                  <img src="https://www.svgrepo.com/show/328273/american-express.svg" alt="Amex" className="h-6 w-10 opacity-70" />
                  <img src="https://www.svgrepo.com/show/334366/paypal.svg" alt="PayPal" className="h-6 w-10 opacity-70" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your payment information is encrypted and secure. We never store your full card details.
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}