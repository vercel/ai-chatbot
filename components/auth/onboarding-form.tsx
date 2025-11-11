"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { GalleryVerticalEnd, ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/shared/toast";
import {
  type CompleteOnboardingState,
  completeOnboarding,
} from "@/app/onboarding/actions";

type Step = 1 | 2 | 3;

const TOTAL_STEPS = 3;

export function OnboardingForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState({
    name: "",
  });
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState<
    CompleteOnboardingState,
    FormData
  >(completeOnboarding, {
    status: "idle",
  });

  useEffect(() => {
    if (state.status === "failed") {
      toast({
        type: "error",
        description: state.message ?? "Failed to complete onboarding",
      });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: state.message ?? "Please fill in all required fields",
      });
    }
  }, [state]);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentStep !== TOTAL_STEPS) {
      handleNext();
      return;
    }

    // On final step, submit the form using startTransition
    startTransition(() => {
      const formDataObj = new FormData();
      formDataObj.set("name", formData.name);
      formAction(formDataObj);
    });
  };

  const getStepTitle = (step: Step) => {
    switch (step) {
      case 1:
        return "Profile Information";
      case 2:
        return "Workspace Setup";
      case 3:
        return "Preferences";
      default:
        return "";
    }
  };

  const getStepDescription = (step: Step) => {
    switch (step) {
      case 1:
        return "Let's start with your basic information";
      case 2:
        return "Configure your workspace and environment";
      case 3:
        return "Customize your experience";
      default:
        return "";
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const step = (i + 1) as Step;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          return (
            <div key={step} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isActive &&
                    "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                  isCompleted && "bg-primary text-primary-foreground",
                  !isActive &&
                    !isCompleted &&
                    "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? "✓" : step}
              </div>
              {step < TOTAL_STEPS && (
                <div
                  className={cn(
                    "h-0.5 w-8 transition-colors",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        <input type="hidden" name="name" value={formData.name} />
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-6" />
              </div>
              <span className="sr-only">Acme Inc.</span>
            </a>
            <h1 className="text-xl font-bold">{getStepTitle(currentStep)}</h1>
            <FieldDescription>{getStepDescription(currentStep)}</FieldDescription>
          </div>

          {/* Step 1: Profile Information */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={state.status === "in_progress" || isPending}
                />
                <FieldDescription>
                  This will be displayed on your profile
                </FieldDescription>
              </Field>
            </div>
          )}

          {/* Step 2: Workspace Setup */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <Field>
                <FieldLabel htmlFor="workspace">Workspace Name</FieldLabel>
                <Input
                  id="workspace"
                  name="workspace"
                  type="text"
                  placeholder="My Workspace"
                  disabled
                />
                <FieldDescription className="text-muted-foreground">
                  Workspace configuration coming soon
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="environment">Environment</FieldLabel>
                <Input
                  id="environment"
                  name="environment"
                  type="text"
                  placeholder="Production"
                  disabled
                />
                <FieldDescription className="text-muted-foreground">
                  Environment setup coming soon
                </FieldDescription>
              </Field>
            </div>
          )}

          {/* Step 3: Personal Preferences */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <Field>
                <FieldLabel htmlFor="theme">Theme Preference</FieldLabel>
                <Input
                  id="theme"
                  name="theme"
                  type="text"
                  placeholder="System Default"
                  disabled
                />
                <FieldDescription className="text-muted-foreground">
                  Theme preferences coming soon
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="notifications">
                  Notification Settings
                </FieldLabel>
                <Input
                  id="notifications"
                  name="notifications"
                  type="text"
                  placeholder="Email notifications"
                  disabled
                />
                <FieldDescription className="text-muted-foreground">
                  Notification preferences coming soon
                </FieldDescription>
              </Field>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || state.status === "in_progress" || isPending}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {TOTAL_STEPS}
            </div>

            <Button
              type="submit"
              disabled={state.status === "in_progress" || isPending}
              className="flex items-center gap-2"
            >
              {currentStep === TOTAL_STEPS ? (
                <>
                  {state.status === "in_progress" || isPending ? "Saving..." : "Complete Setup"}
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </FieldGroup>
      </form>
      <FieldDescription className="px-6 text-center">
        You can update these settings later in your profile
      </FieldDescription>
    </div>
  );
}

