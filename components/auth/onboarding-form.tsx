"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { GalleryVerticalEnd, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2, Sparkles, AlertTriangle, Asterisk, Briefcase, User, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { generateSlug } from "@/lib/utils/slug";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "@/components/shared/toast";
import {
  type CompleteOnboardingState,
  completeOnboarding,
} from "@/app/onboarding/actions";
import { TextLengthIndicator } from "@/components/ui/text-length-indicator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Step = 1 | 2 | 3;

const TOTAL_STEPS = 3;

type OnboardingInitialValues = {
  firstname: string;
  lastname: string;
  job_title: string;
  profile_pic_url: string;
  role_experience: string;
  technical_proficiency: "less" | "regular" | "more";
  tone_of_voice: "friendly" | "balanced" | "efficient" | string;
  ai_generation_guidance: string;
  workspace_name: string;
  workspace_url: string;
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
    label: "Prefer Guidance",
    description: "Simpler language, expanded instructions and explanations.",
  },
  {
    value: "regular",
    label: "Balanced",
    description: "Balanced level of technical detail and general explanations.",
  },
  {
    value: "more",
    label: "Prefer Details",
    description: "Increased technical specifics, assumed understanding of system.",
  },
];

const TONE_OPTIONS: Array<{
  value: "friendly" | "balanced" | "efficient";
  label: string;
  description: string;
  text: string;
}> = [
  {
    value: "friendly",
    label: "Friendly",
    description: "Bubbly and joyful while on the job.",
    text: "Use a friendly, bubbly, and playful tone while maintaining professionalism and appropriateness. Be warm, enthusiastic, and engaging in responses.",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Pleasant to work with and always helpful.",
    text: "Maintain a balanced, professional yet approachable tone. Be warm when appropriate but also efficient and clear in communication.",
  },
  {
    value: "efficient",
    label: "Efficient",
    description: "Direct and to the point, no fluff. Gets stuff done.",
    text: "Use a concise, matter-of-fact tone that prioritizes clarity and brevity. Be direct and helpful while remaining polite and not unfun.",
  },
];

// Helper function to get tone text from selection
function getToneText(value: string): string {
  const option = TONE_OPTIONS.find((opt) => opt.value === value);
  return option?.text || value;
}

type OnboardingFormProps = React.ComponentPropsWithoutRef<"div"> & {
  initialValues: OnboardingInitialValues;
};

// Helper to detect if existing tone_of_voice matches a predefined option
function detectToneValue(toneText: string): "friendly" | "balanced" | "efficient" | string {
  if (!toneText) return "balanced"; // Default to balanced
  // Check if text matches any predefined option
  for (const option of TONE_OPTIONS) {
    if (toneText.toLowerCase().includes(option.value.toLowerCase()) || 
        option.text.toLowerCase() === toneText.toLowerCase().trim()) {
      return option.value;
    }
  }
  // If doesn't match, return as-is (custom text)
  return toneText;
}

export function OnboardingForm({
  initialValues,
  className,
  ...props
}: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  // Initialize tone_of_voice - convert existing text to button value if it matches
  const initialToneValue = typeof initialValues.tone_of_voice === "string" 
    ? detectToneValue(initialValues.tone_of_voice)
    : initialValues.tone_of_voice || "balanced";
  
  const [formData, setFormData] = useState<OnboardingInitialValues>({
    ...initialValues,
    workspace_url: initialValues.workspace_url || generateSlug(initialValues.workspace_name),
    tone_of_voice: initialToneValue,
  });
  const [isPending, startTransition] = useTransition();
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugAvailability, setSlugAvailability] = useState<{
    checking: boolean;
    available: boolean | null;
    error: boolean;
  }>({ checking: false, available: null, error: false });
  const slugCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.trim().length === 0) {
      setSlugAvailability({ checking: false, available: null, error: false });
      return;
    }

    setSlugAvailability({ checking: true, available: null, error: false });

    try {
      const response = await fetch(`/api/workspace/check-slug?slug=${encodeURIComponent(slug)}`);
      
      // Check if response is actually JSON before consuming the body
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        // Clone the response to read it without consuming the original
        const clonedResponse = response.clone();
        const text = await clonedResponse.text();
        console.error("Non-JSON response from API:", text.substring(0, 200));
        setSlugAvailability({ checking: false, available: null, error: true });
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to check availability" }));
        setSlugAvailability({ checking: false, available: null, error: true });
        return;
      }

      const data = await response.json();
      setSlugAvailability({ checking: false, available: data.available ?? false, error: false });
    } catch (error) {
      console.error("Error checking slug availability:", error);
      setSlugAvailability({ checking: false, available: null, error: true });
    }
  };

  const handleInputChange = <K extends keyof OnboardingInitialValues>(
    field: K,
    value: OnboardingInitialValues[K],
  ) => {
    if (field === "workspace_name" && !slugManuallyEdited) {
      // Auto-generate slug from workspace name if not manually edited
      const newSlug = generateSlug(value as string);
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        workspace_url: newSlug,
      }));

      // Check availability with debouncing
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current);
      }
      slugCheckTimeoutRef.current = setTimeout(() => {
        if (newSlug) {
          checkSlugAvailability(newSlug);
        }
      }, 500);
    } else if (field === "workspace_url") {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setSlugManuallyEdited(true);

      // Check availability with debouncing
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current);
      }
      const slugValue = value as string;
      slugCheckTimeoutRef.current = setTimeout(() => {
        if (slugValue) {
          checkSlugAvailability(generateSlug(slugValue));
        }
      }, 500);
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Check slug availability on mount if workspace_url exists
  useEffect(() => {
    if (formData.workspace_url) {
      checkSlugAvailability(formData.workspace_url);
    }
    return () => {
      if (slugCheckTimeoutRef.current) {
        clearTimeout(slugCheckTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      // Convert tone_of_voice selection to predefined text
      const toneText = typeof formData.tone_of_voice === "string" && ["friendly", "balanced", "efficient"].includes(formData.tone_of_voice)
        ? getToneText(formData.tone_of_voice)
        : formData.tone_of_voice;
      formDataObj.set("tone_of_voice", toneText);
      formDataObj.set(
        "ai_generation_guidance",
        formData.ai_generation_guidance,
      );
      formDataObj.set("workspace_name", formData.workspace_name);
      formDataObj.set("workspace_url", generateSlug(formData.workspace_url));
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
        return "Profile Setup";
      case 2:
        return "Workspace Setup";
      case 3:
        return "Assistant Preferences";
      default:
        return "";
    }
  };

  const getStepDescription = (step: Step) => {
    switch (step) {
      case 1:
        return "Let your teammates and assistant know who you are.";
      case 2:
        return "Create a workspace to store your settings and customisations.";
      case 3:
        return "Fine-tune how your personal assistant collaborates with you.";
      default:
        return "";
    }
  };

  const getStepIcon = (step: Step) => {
    switch (step) {
      case 1:
        return User;
      case 2:
        return Briefcase;
      case 3:
        return Sparkles;
      default:
        return GalleryVerticalEnd;
    }
  };

  return (
    <div className={cn("flex h-full flex-col", className)} {...props}>
      {/* Fixed Header */}
      <div className="flex flex-col gap-6 pb-6">
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

        <div className="flex flex-col items-center gap-2 text-center">
          <a
            href="#"
            className="flex flex-col items-center gap-2 font-medium"
          >
            <div className="flex size-8 items-center justify-center rounded-md">
              {(() => {
                const IconComponent = getStepIcon(currentStep);
                return <IconComponent className="size-6" />;
              })()}
            </div>
            <span className="sr-only">Acme Inc.</span>
          </a>
          <h1 className="text-xl font-bold">{getStepTitle(currentStep)}</h1>
          <FieldDescription>{getStepDescription(currentStep)}</FieldDescription>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <FieldGroup className="space-y-8 pb-6">

          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Field>
                <FieldLabel htmlFor="firstname" className="items-center gap-1">
                  First name
                  <Asterisk className="size-3 text-destructive" />
                </FieldLabel>
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
                <FieldLabel htmlFor="lastname" className="items-center gap-1">
                  Last name
                  <Asterisk className="size-3 text-destructive" />
                </FieldLabel>
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
                <FieldLabel htmlFor="job_title" className="items-center gap-2">
                  Job title
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Sparkles className="size-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Helps assistant to understand your perspective and expertise</p>
                    </TooltipContent>
                  </Tooltip>
                </FieldLabel>
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
                <FieldLabel htmlFor="role_experience" className="items-center gap-2">
                  How would you describe your role and experience?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Sparkles className="size-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Shared with AI to improve responses if personalisation is enabled</p>
                    </TooltipContent>
                  </Tooltip>
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
                <TextLengthIndicator
                  length={formData.role_experience.length}
                  optimalRange={{ min: 50, good: 200, max: 2000 }}
                  className="mt-2"
                />
              </Field>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Field>
                <FieldLabel htmlFor="workspace_name" className="items-center gap-1">
                  Workspace name
                  <Asterisk className="size-3 text-destructive" />
                </FieldLabel>
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
                <FieldLabel htmlFor="workspace_url" className="items-center gap-1">
                  Workspace URL
                  <Asterisk className="size-3 text-destructive" />
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="workspace_url"
                    name="workspace_url"
                    type="text"
                    placeholder="acme-operations"
                    required
                    value={formData.workspace_url}
                    onChange={(event) =>
                      handleInputChange("workspace_url", event.target.value)
                    }
                    disabled={isBusy}
                    className={cn(
                      (slugAvailability.checking || slugAvailability.available !== null || slugAvailability.error) && "pr-10",
                      slugAvailability.available === false && "border-destructive",
                    )}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-help">
                        {slugAvailability.checking && (
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        )}
                        {!slugAvailability.checking && slugAvailability.available === true && (
                          <CheckCircle2 className="size-4 text-green-600" />
                        )}
                        {!slugAvailability.checking && slugAvailability.available === false && (
                          <XCircle className="size-4 text-destructive" />
                        )}
                        {!slugAvailability.checking && slugAvailability.error && (
                          <AlertTriangle className="size-4 text-yellow-600" />
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {slugAvailability.checking && "Checking availability..."}
                        {!slugAvailability.checking && slugAvailability.available === true && "This workspace URL is available"}
                        {!slugAvailability.checking && slugAvailability.available === false && "This workspace URL is already taken"}
                        {!slugAvailability.checking && slugAvailability.error && "Error checking availability. Please try again."}
                        {!slugAvailability.checking && slugAvailability.available === null && !slugAvailability.error && "Checking workspace URL availability"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  {(slugAvailability.checking || slugAvailability.available !== null || slugAvailability.error) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {slugAvailability.checking && (
                        <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      )}
                      {!slugAvailability.checking && slugAvailability.available === true && (
                        <CheckCircle2 className="size-4 text-green-600" />
                      )}
                      {!slugAvailability.checking && slugAvailability.available === false && (
                        <XCircle className="size-4 text-destructive" />
                      )}
                      {!slugAvailability.checking && slugAvailability.error && (
                        <AlertTriangle className="size-4 text-yellow-600" />
                      )}
                    </div>
                  )}
                </div>
                <FieldDescription>
                  Used in your workspace URL (e.g., your-workspace.com/workspace/acme-operations)
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
                <FieldLabel htmlFor="business_description" className="items-center gap-2">
                  What does your business do?
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Sparkles className="size-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Helps AI features understand your organisation&apos;s context</p>
                    </TooltipContent>
                  </Tooltip>
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
                <TextLengthIndicator
                  length={formData.business_description.length}
                  optimalRange={{ min: 50, good: 200, max: 4000 }}
                  className="mt-2"
                />
              </Field>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <Field>
                <FieldLabel htmlFor="tone_of_voice" className="items-center gap-2">
                  Assistant tone of voice
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Sparkles className="size-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Guides how chatbots and AI features communicate with you</p>
                    </TooltipContent>
                  </Tooltip>
                </FieldLabel>
                <div className="w-full overflow-hidden">
                  <ToggleGroup
                    type="single"
                    value={typeof formData.tone_of_voice === "string" && ["friendly", "balanced", "efficient"].includes(formData.tone_of_voice)
                      ? formData.tone_of_voice
                      : undefined}
                    onValueChange={(value) => {
                      if (value && ["friendly", "balanced", "efficient"].includes(value)) {
                        handleInputChange(
                          "tone_of_voice",
                          value as "friendly" | "balanced" | "efficient",
                        );
                      }
                    }}
                    className="w-full"
                  >
                    {TONE_OPTIONS.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        disabled={isBusy}
                        className="flex-1 py-2"
                      >
                        <span className="font-medium">{option.label}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                <FieldDescription>
                  {TONE_OPTIONS.find(
                    (opt) => opt.value === formData.tone_of_voice
                  )?.description ??
                    "Select how AI should communicate with you. Friendly on the left, efficient on the right."}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="technical_proficiency" className="items-center gap-2">
                  Technical explanations
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Sparkles className="size-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adjusts the level of detail in AI-generated suggestions</p>
                    </TooltipContent>
                  </Tooltip>
                </FieldLabel>
                <div className="w-full overflow-hidden">
                  <ToggleGroup
                    type="single"
                    value={formData.technical_proficiency}
                    onValueChange={(value) => {
                      if (value) {
                        handleInputChange(
                          "technical_proficiency",
                          value as OnboardingInitialValues["technical_proficiency"],
                        );
                      }
                    }}
                    className="w-full"
                  >
                    {PROFICIENCY_OPTIONS.map((option) => (
                      <ToggleGroupItem
                        key={option.value}
                        value={option.value}
                        disabled={isBusy}
                        className="flex-1 py-2"
                      >
                        <span className="font-medium">{option.label}</span>
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
                <FieldDescription>
                  {PROFICIENCY_OPTIONS.find(
                    (opt) => opt.value === formData.technical_proficiency
                  )?.description ??
                    "Adjusts the level of detail in AI-generated suggestions. Less guidance on the left, more advanced on the right."}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="ai_generation_guidance" className="items-center gap-2">
                  Instructions for your assistant
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Sparkles className="size-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add prompts or preferences you want AI assistants to follow</p>
                    </TooltipContent>
                  </Tooltip>
                </FieldLabel>
                <Textarea
                  id="ai_generation_guidance"
                  name="ai_generation_guidance"
                  placeholder="Don't use em-dashes or emojis. Prefer TypeScript examples with comments when generating code. Avoid academic language."
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
                <TextLengthIndicator
                  length={formData.ai_generation_guidance.length}
                  optimalRange={{ min: 50, good: 200, max: 4000 }}
                  className="mt-2"
                />
              </Field>
            </div>
          )}
          </FieldGroup>
        </div>

        {/* Fixed Footer */}
        <div className="flex flex-col gap-4 border-t bg-background pt-4">
          <div className="flex items-center justify-between gap-4">
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
          
          <FieldDescription className="text-center text-xs">
            You can update all of these settings later.
          </FieldDescription>
        </div>
      </form>
    </div>
  );
}

