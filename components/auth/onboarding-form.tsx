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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/shared/toast";
import {
  type CompleteOnboardingState,
  completeOnboarding,
} from "@/app/onboarding/actions";

type Step = 1 | 2 | 3;

const TOTAL_STEPS = 3;

type OnboardingInitialValues = {
  firstname: string;
  lastname: string;
  job_title: string;
  profile_pic_url: string;
  role_experience: string;
  technical_proficiency: "less" | "regular" | "more";
  tone_of_voice: string;
  ai_generation_guidance: string;
  workspace_name: string;
  workspace_profile_pic_url: string;
  business_description: string;
};

const PROFICIENCY_OPTIONS: Array<{
  value: OnboardingInitialValues["technical_proficiency"];
  label: string;
  description: string;
}> = [
  {
    value: "less",
    label: "Less guidance",
    description: "Prefer detailed, step-by-step explanations.",
  },
  {
    value: "regular",
    label: "Regular",
    description: "Balanced level of technical detail.",
  },
  {
    value: "more",
    label: "More advanced",
    description: "Assume high technical proficiency and concise context.",
  },
];

type OnboardingFormProps = React.ComponentPropsWithoutRef<"div"> & {
  initialValues: OnboardingInitialValues;
};

export function OnboardingForm({
  initialValues,
  className,
  ...props
}: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<OnboardingInitialValues>(initialValues);
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

  useEffect(() => {
    setFormData(initialValues);
  }, [initialValues]);

  const isBusy = state.status === "in_progress" || isPending;

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

  const handleInputChange = <K extends keyof OnboardingInitialValues>(
    field: K,
    value: OnboardingInitialValues[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentStep !== TOTAL_STEPS) {
      handleNext();
      return;
    }

    startTransition(() => {
      const formDataObj = new FormData();
      formDataObj.set("firstname", formData.firstname);
      formDataObj.set("lastname", formData.lastname);
      formDataObj.set("profile_pic_url", formData.profile_pic_url);
      formDataObj.set("job_title", formData.job_title);
      formDataObj.set("role_experience", formData.role_experience);
      formDataObj.set("technical_proficiency", formData.technical_proficiency);
      formDataObj.set("tone_of_voice", formData.tone_of_voice);
      formDataObj.set(
        "ai_generation_guidance",
        formData.ai_generation_guidance,
      );
      formDataObj.set("workspace_name", formData.workspace_name);
      formDataObj.set(
        "workspace_profile_pic_url",
        formData.workspace_profile_pic_url,
      );
      formDataObj.set("business_description", formData.business_description);
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
        return "Tell us about yourself so AI responses feel personal.";
      case 2:
        return "Describe your workspace so teammates and AI understand it.";
      case 3:
        return "Fine-tune how AI should collaborate with you.";
      default:
        return "";
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
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
                    "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? "✓" : step}
              </div>
              {step < TOTAL_STEPS && (
                <div
                  className={cn(
                    "h-0.5 w-8 transition-colors",
                    isCompleted ? "bg-primary" : "bg-muted",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup className="space-y-6">
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

          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <Field>
                <FieldLabel htmlFor="firstname">First name</FieldLabel>
                <Input
                  id="firstname"
                  name="firstname"
                  type="text"
                  placeholder="Casey"
                  required
                  value={formData.firstname}
                  onChange={(event) =>
                    handleInputChange("firstname", event.target.value)
                  }
                  disabled={isBusy}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="lastname">Last name</FieldLabel>
                <Input
                  id="lastname"
                  name="lastname"
                  type="text"
                  placeholder="Morgan"
                  required
                  value={formData.lastname}
                  onChange={(event) =>
                    handleInputChange("lastname", event.target.value)
                  }
                  disabled={isBusy}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="job_title">Job title</FieldLabel>
                <Input
                  id="job_title"
                  name="job_title"
                  type="text"
                  placeholder="Operations Manager"
                  value={formData.job_title}
                  onChange={(event) =>
                    handleInputChange("job_title", event.target.value)
                  }
                  disabled={isBusy}
                />
                <FieldDescription>
                  Helps teammates and AI features understand your responsibilities.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="profile_pic_url">
                  Profile picture URL
                </FieldLabel>
                <Input
                  id="profile_pic_url"
                  name="profile_pic_url"
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  value={formData.profile_pic_url}
                  onChange={(event) =>
                    handleInputChange("profile_pic_url", event.target.value)
                  }
                  disabled={isBusy}
                />
                <FieldDescription>
                  Provide a public image URL to personalise your account.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="role_experience">
                  How would you describe your role and experience?
                </FieldLabel>
                <Textarea
                  id="role_experience"
                  name="role_experience"
                  placeholder="I lead the operations team and focus on process optimisation..."
                  rows={4}
                  value={formData.role_experience}
                  onChange={(event) =>
                    handleInputChange("role_experience", event.target.value)
                  }
                  disabled={isBusy}
                />
                <FieldDescription>
                  Shared with AI assistants to tailor their responses.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="technical_proficiency">
                  Technical proficiency
                </FieldLabel>
                <Select
                  value={formData.technical_proficiency}
                  onValueChange={(value) =>
                    handleInputChange(
                      "technical_proficiency",
                      value as OnboardingInitialValues["technical_proficiency"],
                    )
                  }
                  disabled={isBusy}
                >
                  <SelectTrigger id="technical_proficiency" className="w-full">
                    <SelectValue placeholder="Select your preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFICIENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-muted-foreground text-xs">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Adjusts the level of detail in AI-generated suggestions.
                </FieldDescription>
              </Field>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <Field>
                <FieldLabel htmlFor="workspace_name">Workspace name</FieldLabel>
                <Input
                  id="workspace_name"
                  name="workspace_name"
                  type="text"
                  placeholder="Acme Operations"
                  required
                  value={formData.workspace_name}
                  onChange={(event) =>
                    handleInputChange("workspace_name", event.target.value)
                  }
                  disabled={isBusy}
                />
                <FieldDescription>
                  Displayed across the product and used in AI prompts.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="workspace_profile_pic_url">
                  Workspace avatar URL
                </FieldLabel>
                <Input
                  id="workspace_profile_pic_url"
                  name="workspace_profile_pic_url"
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={formData.workspace_profile_pic_url}
                  onChange={(event) =>
                    handleInputChange(
                      "workspace_profile_pic_url",
                      event.target.value,
                    )
                  }
                  disabled={isBusy}
                />
                <FieldDescription>
                  Optional image used in navigation and shared content.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="business_description">
                  What does your business do?
                </FieldLabel>
                <Textarea
                  id="business_description"
                  name="business_description"
                  placeholder="We provide logistics services for e-commerce retailers..."
                  rows={4}
                  value={formData.business_description}
                  onChange={(event) =>
                    handleInputChange("business_description", event.target.value)
                  }
                  disabled={isBusy}
                />
                <FieldDescription>
                  Helps AI features understand your organisation&apos;s context.
                </FieldDescription>
              </Field>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <Field>
                <FieldLabel htmlFor="tone_of_voice">
                  Preferred tone of voice
                </FieldLabel>
                <Textarea
                  id="tone_of_voice"
                  name="tone_of_voice"
                  placeholder="Friendly and collaborative, but concise when sharing action items."
                  rows={4}
                  value={formData.tone_of_voice}
                  onChange={(event) =>
                    handleInputChange("tone_of_voice", event.target.value)
                  }
                  disabled={isBusy}
                />
                <FieldDescription>
                  Guides how chatbots and AI features communicate with you.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="ai_generation_guidance">
                  Guidance for generated content
                </FieldLabel>
                <Textarea
                  id="ai_generation_guidance"
                  name="ai_generation_guidance"
                  placeholder="Prefer TypeScript examples with comments and unit tests."
                  rows={5}
                  value={formData.ai_generation_guidance}
                  onChange={(event) =>
                    handleInputChange(
                      "ai_generation_guidance",
                      event.target.value,
                    )
                  }
                  disabled={isBusy}
                />
                <FieldDescription>
                  Add prompts or preferences you want AI assistants to follow.
                </FieldDescription>
              </Field>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || isBusy}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="size-4" />
              Back
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {TOTAL_STEPS}
            </div>

            <Button type="submit" disabled={isBusy} className="flex items-center gap-2">
              {currentStep === TOTAL_STEPS ? (
                <>{isBusy ? "Saving..." : "Complete Setup"}</>
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
        You can update these settings later in your profile.
      </FieldDescription>
    </div>
  );
}

