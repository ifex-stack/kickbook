import { useState } from "react";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  title: string;
  description: string;
  icon: string;
}

const steps: OnboardingStep[] = [
  {
    title: "Manage Your Team",
    description: "Create your team profile, add players, and manage their stats all in one place.",
    icon: "groups",
  },
  {
    title: "Book Sessions",
    description: "Schedule practice sessions and matches, and let players confirm their attendance.",
    icon: "event_available",
  },
  {
    title: "Track Performance",
    description: "Record match results, player stats, and view team performance over time.",
    icon: "insights",
  },
];

interface WalkthroughProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function Walkthrough({ onComplete, onSkip }: WalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 shadow-lg overflow-hidden">
        <div className="p-5 relative">
          <button 
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            onClick={onSkip}
          >
            <span className="material-icons">close</span>
          </button>
          
          <div className="flex items-center justify-center mb-6">
            <span className="material-icons text-primary-DEFAULT dark:text-primary-light text-4xl mr-2">sports_soccer</span>
            <h2 className="text-2xl font-heading font-bold text-primary-DEFAULT dark:text-primary-light">KickBook</h2>
          </div>

          {/* Onboarding step */}
          <div className="text-center px-4 mb-6">
            <div className="h-40 flex items-center justify-center mb-6">
              <span className="material-icons text-7xl text-primary-DEFAULT dark:text-primary-light">
                {steps[currentStep].icon}
              </span>
            </div>
            <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-gray-100 mb-2">
              {steps[currentStep].title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {steps[currentStep].description}
            </p>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center items-center mb-6">
            {steps.map((_, index) => (
              <span 
                key={index}
                className={cn(
                  "onboarding-dot",
                  index === currentStep 
                    ? "active" 
                    : "bg-gray-300 dark:bg-gray-600"
                )}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-4">
            <button 
              className="flex-1 py-2 px-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              onClick={onSkip}
            >
              Skip
            </button>
            <button 
              className="flex-1 py-2 px-4 bg-primary-DEFAULT hover:bg-primary-dark text-white rounded-md font-medium transition-colors"
              onClick={handleNext}
            >
              {currentStep < steps.length - 1 ? "Next" : "Get Started"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
