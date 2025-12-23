"use client";

import {
  Bot,
  Brain,
  Code,
  Pen,
  Plus,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export interface PersonaConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  temperature?: number;
  topP?: number;
  icon?: React.ReactNode;
  category?: string;
  customInstructions?: string;
  isDefault?: boolean;
}

const PRESET_PERSONAS: PersonaConfig[] = [
  {
    id: "default",
    name: "Default Assistant",
    description: "Helpful, harmless, and honest AI assistant",
    systemPrompt:
      "You are a helpful AI assistant. Provide clear, accurate, and concise responses.",
    temperature: 0.7,
    icon: <Bot className="h-4 w-4" />,
    category: "general",
    isDefault: true,
  },
  {
    id: "coder",
    name: "Expert Coder",
    description: "Specialized in software development and debugging",
    systemPrompt: `You are an expert software engineer with deep knowledge across multiple programming languages and frameworks. Focus on:
- Writing clean, maintainable code
- Following best practices and design patterns
- Explaining complex concepts clearly
- Providing working code examples
- Debugging issues systematically`,
    temperature: 0.3,
    icon: <Code className="h-4 w-4" />,
    category: "coding",
  },
  {
    id: "analyst",
    name: "Data Analyst",
    description: "Expert in data analysis and insights",
    systemPrompt: `You are a data analyst with expertise in statistics, data visualization, and deriving actionable insights. Focus on:
- Analyzing data patterns and trends
- Providing statistical interpretations
- Recommending visualizations
- Explaining findings clearly
- Suggesting next steps for analysis`,
    temperature: 0.5,
    icon: <Brain className="h-4 w-4" />,
    category: "analysis",
  },
  {
    id: "writer",
    name: "Creative Writer",
    description: "Engaging content and creative writing",
    systemPrompt: `You are a creative writer skilled in various writing styles. Focus on:
- Crafting engaging narratives
- Using vivid descriptions
- Adapting tone to context
- Creating compelling content
- Maintaining reader interest`,
    temperature: 0.9,
    icon: <Pen className="h-4 w-4" />,
    category: "creative",
  },
  {
    id: "tutor",
    name: "Patient Tutor",
    description: "Educational explanations for learners",
    systemPrompt: `You are a patient tutor who explains concepts clearly to learners. Focus on:
- Breaking down complex topics
- Using analogies and examples
- Checking understanding
- Encouraging questions
- Building on foundational knowledge progressively`,
    temperature: 0.6,
    icon: <Brain className="h-4 w-4" />,
    category: "education",
  },
  {
    id: "critic",
    name: "Constructive Critic",
    description: "Detailed feedback and improvement suggestions",
    systemPrompt: `You are a constructive critic who provides detailed, actionable feedback. Focus on:
- Identifying strengths and weaknesses
- Providing specific improvement suggestions
- Explaining the reasoning behind feedback
- Balancing criticism with encouragement
- Prioritizing high-impact changes`,
    temperature: 0.4,
    icon: <Sparkles className="h-4 w-4" />,
    category: "feedback",
  },
];

interface PersonaSelectorProps {
  selectedPersonaId: string;
  onPersonaChange?: (persona: PersonaConfig) => void;
  allowCustom?: boolean;
}

export function PersonaSelector({
  selectedPersonaId,
  onPersonaChange,
  allowCustom = true,
}: PersonaSelectorProps) {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customPersona, setCustomPersona] = useState<PersonaConfig>({
    id: "custom",
    name: "Custom Persona",
    description: "",
    systemPrompt: "",
    temperature: 0.7,
    icon: <User className="h-4 w-4" />,
    category: "custom",
  });

  const selectedPersona =
    PRESET_PERSONAS.find((p) => p.id === selectedPersonaId) ||
    PRESET_PERSONAS[0];

  const handlePersonaSelect = (personaId: string) => {
    if (personaId === "custom") {
      setIsCustomizing(true);
    } else {
      const persona = PRESET_PERSONAS.find((p) => p.id === personaId);
      if (persona) {
        onPersonaChange?.(persona);
      }
    }
  };

  const handleCustomPersonaSave = () => {
    if (customPersona.name && customPersona.systemPrompt) {
      onPersonaChange?.(customPersona);
      setIsCustomizing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle className="text-base">AI Persona</CardTitle>
          </div>
          {allowCustom && !isCustomizing && (
            <Button
              onClick={() => setIsCustomizing(true)}
              size="sm"
              variant="outline"
            >
              <Plus className="mr-1 h-4 w-4" />
              Custom
            </Button>
          )}
        </div>
        <CardDescription className="text-xs">
          Choose how the AI should respond
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCustomizing ? (
          <>
            {/* Custom Persona Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="persona-name">Persona Name</Label>
                <Input
                  id="persona-name"
                  onChange={(e) =>
                    setCustomPersona({ ...customPersona, name: e.target.value })
                  }
                  placeholder="e.g., Technical Writer"
                  value={customPersona.name}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="persona-desc">Description</Label>
                <Input
                  id="persona-desc"
                  onChange={(e) =>
                    setCustomPersona({
                      ...customPersona,
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of the persona"
                  value={customPersona.description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="persona-prompt">System Prompt</Label>
                <Textarea
                  className="min-h-[120px]"
                  id="persona-prompt"
                  onChange={(e) =>
                    setCustomPersona({
                      ...customPersona,
                      systemPrompt: e.target.value,
                    })
                  }
                  placeholder="Define how the AI should behave and respond..."
                  value={customPersona.systemPrompt}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="persona-temp">
                  Temperature: {customPersona.temperature?.toFixed(1)}
                </Label>
                <input
                  className="w-full"
                  id="persona-temp"
                  max="1"
                  min="0"
                  onChange={(e) =>
                    setCustomPersona({
                      ...customPersona,
                      temperature: Number.parseFloat(e.target.value),
                    })
                  }
                  step="0.1"
                  type="range"
                  value={customPersona.temperature}
                />
                <p className="text-muted-foreground text-xs">
                  Lower = more focused, Higher = more creative
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => setIsCustomizing(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={!customPersona.name || !customPersona.systemPrompt}
                  onClick={handleCustomPersonaSave}
                >
                  Save Persona
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Select
              onValueChange={handlePersonaSelect}
              value={selectedPersonaId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESET_PERSONAS.map((persona) => (
                  <SelectItem key={persona.id} value={persona.id}>
                    <div className="flex items-center gap-2">
                      {persona.icon}
                      <span>{persona.name}</span>
                    </div>
                  </SelectItem>
                ))}
                {allowCustom && (
                  <SelectItem value="custom">Custom Persona...</SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Persona Details */}
            <div className="space-y-3 pt-2">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  {selectedPersona.icon}
                  <span className="font-medium text-sm">
                    {selectedPersona.name}
                  </span>
                  {selectedPersona.isDefault && (
                    <Badge className="h-5 text-xs" variant="secondary">
                      Default
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  {selectedPersona.description}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-xs">System Prompt:</Label>
                <ScrollArea className="h-24 rounded-md border p-2">
                  <p className="whitespace-pre-wrap text-muted-foreground text-xs">
                    {selectedPersona.systemPrompt}
                  </p>
                </ScrollArea>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <Label className="text-xs">Temperature</Label>
                  <div className="font-semibold text-lg">
                    {selectedPersona.temperature?.toFixed(1) || "0.7"}
                  </div>
                  <p className="text-muted-foreground text-xs">Creativity</p>
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <div className="font-semibold text-lg capitalize">
                    {selectedPersona.category || "general"}
                  </div>
                  <p className="text-muted-foreground text-xs">Type</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Export presets for use elsewhere
export { PRESET_PERSONAS };
