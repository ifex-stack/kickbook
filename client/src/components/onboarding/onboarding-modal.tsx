import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ChevronLeft, ChevronRight } from "lucide-react";

interface OnboardingStep {
  title: string;
  description: string;
  image?: string;
}

export function OnboardingModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps: OnboardingStep[] = [
    {
      title: "Welcome to KickBook!",
      description: "Your all-in-one platform for managing football teams, bookings, and player stats. Let's walk through the basics to get you started.",
      image: "/onboarding/welcome.svg"
    },
    {
      title: "Team Management",
      description: "Create and manage your football team. Invite players with a unique invitation code, track team stats, and organize matches.",
      image: "/onboarding/team.svg"
    },
    {
      title: "Bookings Made Easy",
      description: "Create bookings for your team, specify the format (5-a-side, 7-a-side, or 11-a-side), and manage attendance.",
      image: "/onboarding/booking.svg"
    },
    {
      title: "Credits System",
      description: "KickBook uses a credit system for bookings. Each player slot requires 1 credit. Purchase credits in advance and use them when booking.",
      image: "/onboarding/credits.svg"
    },
    {
      title: "Track Stats & Achievements",
      description: "Record match statistics, track player performance, and earn achievements based on your team's success.",
      image: "/onboarding/stats.svg"
    }
  ];
  
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {currentStepData.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-6">
          {currentStepData.image && (
            <div className="flex justify-center mb-6">
              <div className="w-64 h-64 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <img 
                  src={currentStepData.image} 
                  alt={currentStepData.title}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          )}
          
          <p className="text-center text-gray-600 dark:text-gray-300">
            {currentStepData.description}
          </p>
          
          <div className="mt-8">
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex justify-center mt-4">
              {steps.map((_, index) => (
                <div 
                  key={index}
                  className="mx-1 cursor-pointer"
                  onClick={() => setCurrentStep(index)}
                >
                  {index === currentStep ? (
                    <CheckCircle2 className="text-primary h-5 w-5" />
                  ) : (
                    <Circle className="text-gray-300 dark:text-gray-600 h-5 w-5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button onClick={nextStep}>
            {currentStep < steps.length - 1 ? (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}