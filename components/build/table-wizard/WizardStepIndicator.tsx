"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type WizardStepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
};

export function WizardStepIndicator({
  currentStep,
  totalSteps,
}: WizardStepIndicatorProps) {
  return (
    <div className="flex items-center gap-4">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        const isPending = step > currentStep;

        return (
          <div key={step} className="flex items-center">
            <div className="flex items-center">
              {/* Step circle */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors",
                  isCompleted &&
                    "bg-primary border-primary text-primary-foreground",
                  isCurrent &&
                    "bg-primary border-primary text-primary-foreground",
                  isPending && "bg-background border-muted-foreground/30"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{step}</span>
                )}
              </div>

              {/* Connecting line */}
              {step < totalSteps && (
                <div
                  className={cn(
                    "w-12 h-0.5 transition-colors",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          </div>
        );
      })}
      <div className="ml-auto text-sm text-muted-foreground">
        Step {currentStep} of {totalSteps}
      </div>
    </div>
  );
}

