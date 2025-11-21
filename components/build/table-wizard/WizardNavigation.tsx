"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { canProceedToNextStep } from "@/lib/build/table-wizard/validation";
import type { WizardState } from "@/lib/build/table-wizard/types";

type WizardNavigationProps = {
  currentStep: number;
  totalSteps: number;
  state: WizardState;
  goToStep: (step: number) => void;
};

export function WizardNavigation({
  currentStep,
  totalSteps,
  state,
  goToStep,
}: WizardNavigationProps) {
  const canGoNext = canProceedToNextStep(currentStep, state);
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const handleBack = () => {
    if (!isFirstStep) {
      goToStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext && !isLastStep) {
      goToStep(currentStep + 1);
    }
  };

  return (
    <div className="flex justify-between items-center">
      <Button
        type="button"
        variant="outline"
        onClick={handleBack}
        disabled={isFirstStep}
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="text-sm text-muted-foreground">
        {!canGoNext && "Please complete all required fields to continue"}
      </div>

      {!isLastStep ? (
        <Button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      ) : null}
    </div>
  );
}

