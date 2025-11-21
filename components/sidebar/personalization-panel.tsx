"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/shared/toast";
import { X } from "lucide-react";

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

  // Update form data when props change
  useEffect(() => {
    setFormData({
      ai_context: aiContext || "",
      proficiency: proficiency || "regular",
      ai_tone: aiTone || "balanced",
      ai_guidance: aiGuidance || "",
    });
  }, [aiContext, proficiency, aiTone, aiGuidance]);

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

        toast({
          type: "success",
          description: "Personalization preferences saved successfully",
        });
        onOpenChange(false);
      } catch (error) {
        toast({
          type: "error",
          description: "Failed to save preferences. Please try again.",
        });
        console.error("Error saving preferences:", error);
      }
    });
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pointer-events-none">
        <div
          className="bg-background border rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">Personalization</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Help the AI tailor its responses to your preferences and working style
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Background/Interests */}
            <div className="space-y-3">
              <Label htmlFor="ai_context" className="text-sm font-medium">
                Who inspires you or shapes your taste?
              </Label>
              <Textarea
                id="ai_context"
                placeholder="e.g., Nilay Patel and The Verge / Vergecast"
                value={formData.ai_context}
                onChange={(e) =>
                  setFormData({ ...formData, ai_context: e.target.value })
                }
                className="min-h-[80px] resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                Help the AI understand your background and interests
              </p>
            </div>

            {/* Technical Proficiency */}
            <div className="space-y-3">
              <Label htmlFor="proficiency" className="text-sm font-medium">
                Technical proficiency
              </Label>
              <Input
                id="proficiency"
                placeholder="e.g., less, regular, more"
                value={formData.proficiency}
                onChange={(e) =>
                  setFormData({ ...formData, proficiency: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Options: "less" (prefer guidance), "regular" (balanced), "more" (prefer details)
              </p>
            </div>

            {/* Tone of Voice */}
            <div className="space-y-3">
              <Label htmlFor="ai_tone" className="text-sm font-medium">
                How do you want the AI to write?
              </Label>
              <Input
                id="ai_tone"
                placeholder="e.g., friendly, balanced, efficient"
                value={formData.ai_tone}
                onChange={(e) =>
                  setFormData({ ...formData, ai_tone: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Options: "friendly" (bubbly), "balanced" (professional), "efficient" (direct)
              </p>
            </div>

            {/* Additional Context */}
            <div className="space-y-3">
              <Label htmlFor="ai_guidance" className="text-sm font-medium">
                What else should the AI know about you?
              </Label>
              <Textarea
                id="ai_guidance"
                placeholder="e.g., I'm a software engineer / product manager"
                value={formData.ai_guidance}
                onChange={(e) =>
                  setFormData({ ...formData, ai_guidance: e.target.value })
                }
                className="min-h-[100px] resize-none"
                maxLength={4000}
              />
              <p className="text-xs text-muted-foreground">
                Any additional context that will help the AI assist you better
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex gap-3">
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
      </div>
    </>
  );
}
