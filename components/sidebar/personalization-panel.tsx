"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "@/components/shared/toast";
import { X, Settings, MessageSquare, Code, Zap, Plus, Trash2 } from "lucide-react";

type PersonalizationPanelProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  aiContext?: string | null;
  proficiency?: string | null;
  aiTone?: string | null;
  aiGuidance?: string | null;
};

type Skill = {
  id: string;
  name: string;
  description: string;
  prompt: string;
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
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState({ name: "", description: "", prompt: "" });
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  // Update form data when props change
  useEffect(() => {
    setFormData({
      ai_context: aiContext || "",
      proficiency: proficiency || "regular",
      ai_tone: aiTone || "balanced",
      ai_guidance: aiGuidance || "",
    });
  }, [aiContext, proficiency, aiTone, aiGuidance]);

  // Load skills when panel opens
  useEffect(() => {
    if (open) {
      loadSkills();
    }
  }, [open]);

  const loadSkills = async () => {
    try {
      const response = await fetch("/api/user/skills");
      if (response.ok) {
        const data = await response.json();
        setSkills(data.skills || []);
      }
    } catch (error) {
      console.error("Error loading skills:", error);
    }
  };

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

  const handleAddSkill = async () => {
    if (!newSkill.name || !newSkill.prompt) {
      toast({
        type: "error",
        description: "Please provide a name and prompt for the skill",
      });
      return;
    }

    try {
      const response = await fetch("/api/user/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSkill),
      });

      if (!response.ok) {
        throw new Error("Failed to add skill");
      }

      const data = await response.json();
      setSkills([...skills, data.skill]);
      setNewSkill({ name: "", description: "", prompt: "" });
      setIsAddingSkill(false);

      toast({
        type: "success",
        description: "Skill added successfully",
      });
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to add skill. Please try again.",
      });
      console.error("Error adding skill:", error);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    try {
      const response = await fetch(`/api/user/skills/${skillId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete skill");
      }

      setSkills(skills.filter((s) => s.id !== skillId));

      toast({
        type: "success",
        description: "Skill deleted successfully",
      });
    } catch (error) {
      toast({
        type: "error",
        description: "Failed to delete skill. Please try again.",
      });
      console.error("Error deleting skill:", error);
    }
  };

  const proficiencyOptions = [
    { value: "less", label: "Prefer Guidance", description: "Simpler language, more explanations" },
    { value: "regular", label: "Balanced", description: "Mix of clarity and detail" },
    { value: "more", label: "Prefer Details", description: "Technical specifics, less hand-holding" },
  ];

  const toneOptions = [
    { value: "friendly", label: "Friendly", description: "Bubbly and playful" },
    { value: "balanced", label: "Balanced", description: "Professional yet approachable" },
    { value: "efficient", label: "Efficient", description: "Direct and concise" },
  ];

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
          className="bg-background border rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-background border-b px-6 py-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold">AI Personalization</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Customize how the AI assistant works for you
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

          {/* Tabs Content */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="general" className="w-full">
              <div className="border-b px-6">
                <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
                  <TabsTrigger value="general" className="gap-2">
                    <Settings className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="conversation" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Conversation
                  </TabsTrigger>
                  <TabsTrigger value="generation" className="gap-2">
                    <Code className="h-4 w-4" />
                    Generation
                  </TabsTrigger>
                  <TabsTrigger value="skills" className="gap-2">
                    <Zap className="h-4 w-4" />
                    Skills
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* General Tab */}
              <TabsContent value="general" className="p-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>General Preferences</CardTitle>
                    <CardDescription>
                      Help the AI understand your background and interests
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
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
                        className="min-h-[80px] resize-none"
                        maxLength={2000}
                      />
                      <p className="text-xs text-muted-foreground">
                        Share your influences to help personalize responses
                      </p>
                    </div>

                    <div className="space-y-3">
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
                        className="min-h-[100px] resize-none"
                        maxLength={4000}
                      />
                      <p className="text-xs text-muted-foreground">
                        Any additional context that will help the AI assist you better
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Conversation Tab */}
              <TabsContent value="conversation" className="p-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Conversation Style</CardTitle>
                    <CardDescription>
                      Customize how the AI communicates with you
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Technical proficiency</Label>
                      <div className="grid gap-2">
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

                    <div className="space-y-3">
                      <Label>Tone of voice</Label>
                      <div className="grid gap-2">
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
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Generation Tab */}
              <TabsContent value="generation" className="p-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Output Generation</CardTitle>
                    <CardDescription>
                      Configure how the AI generates code and other outputs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="code_style">Code style preferences</Label>
                      <Textarea
                        id="code_style"
                        placeholder="e.g., Use TypeScript, prefer functional programming, include comments"
                        className="min-h-[80px] resize-none"
                        maxLength={1000}
                      />
                      <p className="text-xs text-muted-foreground">
                        Describe your preferred coding style and conventions
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="output_format">Default output format</Label>
                      <Input
                        id="output_format"
                        placeholder="e.g., markdown, code blocks, step-by-step"
                      />
                      <p className="text-xs text-muted-foreground">
                        How you prefer responses to be formatted
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="language_preference">Primary programming language</Label>
                      <Input
                        id="language_preference"
                        placeholder="e.g., TypeScript, Python, Rust"
                      />
                      <p className="text-xs text-muted-foreground">
                        Default language for code examples (coming soon)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills Tab */}
              <TabsContent value="skills" className="p-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Custom Skills</CardTitle>
                    <CardDescription>
                      Create reusable prompts and shortcuts for common tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {skills.length === 0 && !isAddingSkill && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No skills created yet. Add your first skill to get started.
                      </div>
                    )}

                    {skills.map((skill) => (
                      <div
                        key={skill.id}
                        className="rounded-lg border p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{skill.name}</h4>
                            {skill.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {skill.description}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteSkill(skill.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-xs font-mono bg-muted p-2 rounded">
                          {skill.prompt}
                        </div>
                      </div>
                    ))}

                    {isAddingSkill && (
                      <div className="rounded-lg border p-4 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="skill_name">Skill name</Label>
                          <Input
                            id="skill_name"
                            placeholder="e.g., Code Review"
                            value={newSkill.name}
                            onChange={(e) =>
                              setNewSkill({ ...newSkill, name: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skill_description">
                            Description (optional)
                          </Label>
                          <Input
                            id="skill_description"
                            placeholder="What does this skill do?"
                            value={newSkill.description}
                            onChange={(e) =>
                              setNewSkill({ ...newSkill, description: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="skill_prompt">Prompt</Label>
                          <Textarea
                            id="skill_prompt"
                            placeholder="The prompt to execute when this skill is invoked"
                            value={newSkill.prompt}
                            onChange={(e) =>
                              setNewSkill({ ...newSkill, prompt: e.target.value })
                            }
                            className="min-h-[100px] resize-none font-mono text-xs"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsAddingSkill(false);
                              setNewSkill({ name: "", description: "", prompt: "" });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleAddSkill}>
                            Add Skill
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isAddingSkill && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setIsAddingSkill(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Skill
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="bg-background border-t px-6 py-4 flex gap-3">
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
