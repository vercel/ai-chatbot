"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/shared/toast";

type PersonalizationPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiContext?: string | null;
  proficiency?: string | null;
  aiTone?: string | null;
  aiGuidance?: string | null;
};

export function PersonalizationPanel({
  open,
  onOpenChange,
  aiContext = "",
  proficiency = "regular",
  aiTone = "balanced",
  aiGuidance = "",
}: PersonalizationPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    ai_context: aiContext || "",
    proficiency: proficiency || "regular",
    ai_tone: aiTone || "balanced",
    ai_guidance: aiGuidance || "",
  });

  const handleSave = async () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to save preferences");
        }

        toast.success("Personalization preferences saved successfully");
        onOpenChange(false);
      } catch (error) {
        toast.error("Failed to save preferences. Please try again.");
        console.error("Error saving preferences:", error);
      }
    });
  };

  const proficiencyOptions = [
    {
      value: "less",
      label: "Prefer Guidance",
      description: "Simpler language, more explanations",
    },
    {
      value: "regular",
      label: "Balanced",
      description: "Mix of clarity and detail",
    },
    {
      value: "more",
      label: "Prefer Details",
      description: "Technical specifics, less hand-holding",
    },
  ];

  const toneOptions = [
    {
      value: "friendly",
      label: "Friendly",
      description: "Bubbly and playful",
    },
    {
      value: "balanced",
      label: "Balanced",
      description: "Professional yet approachable",
    },
    {
      value: "efficient",
      label: "Efficient",
      description: "Direct and concise",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md overflow-y-auto"
        side="right"
      >
        <SheetHeader>
          <SheetTitle>Personalization</SheetTitle>
          <SheetDescription>
            Help the AI tailor its responses to your preferences and working style
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* About You */}
          <div className="space-y-2">
            <Label htmlFor="ai_context">
              Who inspires you or shapes your taste?
            </Label>
            <Textarea
              id="ai_context"
              placeholder="e.g., Nilay Patel and The Verge / Vergecast"
              value={formData.ai_context}
              onChange={(e) =>
                setFormData({ ...formData, ai_context: e.target.value })
              }
              className="min-h-[60px] resize-none text-sm"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              Help the AI understand your background and interests
            </p>
          </div>

          {/* Technical Proficiency */}
          <div className="space-y-3">
            <Label>Technical proficiency</Label>
            <div className="space-y-2">
              {proficiencyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, proficiency: option.value })
                  }
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    formData.proficiency === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tone of Voice */}
          <div className="space-y-3">
            <Label>How do you want the AI to write?</Label>
            <div className="space-y-2">
              {toneOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, ai_tone: option.value })
                  }
                  className={`w-full text-left rounded-lg border p-3 transition-colors ${
                    formData.ai_tone === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* What else should AI know */}
          <div className="space-y-2">
            <Label htmlFor="ai_guidance">
              What else should the AI know about you?
            </Label>
            <Textarea
              id="ai_guidance"
              placeholder="e.g., I'm a software engineer / product manager"
              value={formData.ai_guidance}
              onChange={(e) =>
                setFormData({ ...formData, ai_guidance: e.target.value })
              }
              className="min-h-[80px] resize-none text-sm"
              maxLength={4000}
            />
            <p className="text-xs text-muted-foreground">
              Any additional context that will help the AI assist you better
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
