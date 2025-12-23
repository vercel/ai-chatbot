"use client";

import {
  ArrowRight,
  BarChart3,
  BookTemplate,
  CheckCircle2,
  Code,
  GitBranch,
  Sparkles,
  Split,
  User,
} from "lucide-react";
import { useState } from "react";
import {
  type ConversationBranch,
  ConversationBranching,
} from "@/components/conversation-branching";
import { ModelComparison } from "@/components/model-comparison";
import {
  type PersonaConfig,
  PersonaSelector,
} from "@/components/persona-selector";
import {
  PromptLibrary,
  type PromptTemplate,
} from "@/components/prompt-library";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsageAnalytics } from "@/components/usage-analytics";
import { ENHANCED_MODEL_CATALOG } from "@/lib/ai/enhanced-models";
import { getIconComponent } from "@/lib/ai/icon-utils";

// Mock data for demo
const MOCK_BRANCHES: ConversationBranch[] = [
  {
    id: "main",
    parentId: null,
    messageIndex: 0,
    title: "Main Conversation",
    createdAt: new Date(),
    messages: [],
    isActive: true,
  },
  {
    id: "alt-1",
    parentId: "main",
    messageIndex: 5,
    title: "Alternative Approach",
    createdAt: new Date(),
    messages: [],
    isActive: false,
  },
];

export default function FeaturesDemo() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState("default");

  const features = [
    {
      id: "model-selector",
      title: "Enhanced Model Selector",
      description:
        "Choose from 7+ AI models with real-time cost and speed indicators",
      icon: <Code className="h-6 w-6" />,
      color: "bg-blue-500",
      highlights: [
        "Visual model cards with provider icons",
        "Real-time cost & speed indicators",
        "Context window display",
        "Capability badges",
      ],
    },
    {
      id: "model-comparison",
      title: "Model Comparison",
      description: "Compare responses from multiple models side-by-side",
      icon: <Split className="h-6 w-6" />,
      color: "bg-purple-500",
      highlights: [
        "Up to 4 models simultaneously",
        "Performance metrics",
        "Token usage tracking",
        "Response time comparison",
      ],
    },
    {
      id: "prompt-library",
      title: "Prompt Template Library",
      description: "10+ pre-built templates for common tasks",
      icon: <BookTemplate className="h-6 w-6" />,
      color: "bg-green-500",
      highlights: [
        "Code review, debugging, refactoring",
        "Blog writing, email drafting",
        "Data analysis, summarization",
        "Variable substitution",
      ],
    },
    {
      id: "analytics",
      title: "Usage Analytics",
      description: "Track usage, costs, and performance metrics",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "bg-orange-500",
      highlights: [
        "Token usage tracking",
        "Cost breakdown by model",
        "Success rate monitoring",
        "Time range filters",
      ],
    },
    {
      id: "branching",
      title: "Conversation Branching",
      description: "Fork conversations to explore different paths",
      icon: <GitBranch className="h-6 w-6" />,
      color: "bg-pink-500",
      highlights: [
        "Tree visualization",
        "Switch between branches",
        "No lost conversations",
        "Easy comparison",
      ],
    },
    {
      id: "personas",
      title: "AI Personas",
      description: "6 preset personas + custom persona creation",
      icon: <User className="h-6 w-6" />,
      color: "bg-indigo-500",
      highlights: [
        "Expert Coder, Data Analyst",
        "Creative Writer, Tutor",
        "Custom persona creation",
        "Temperature control",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="border-b bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-12">
          <div className="mb-6 flex items-center justify-center">
            <Sparkles className="mr-4 h-12 w-12 text-primary" />
            <h1 className="font-bold text-4xl md:text-5xl">
              TiQology Elite Features
            </h1>
          </div>
          <p className="mx-auto mb-8 max-w-3xl text-center text-muted-foreground text-xl">
            Advanced AI chat capabilities that put TiQology ahead of galaxy.ai
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="px-4 py-2 text-sm" variant="secondary">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              7+ AI Models
            </Badge>
            <Badge className="px-4 py-2 text-sm" variant="secondary">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Real-time Analytics
            </Badge>
            <Badge className="px-4 py-2 text-sm" variant="secondary">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Conversation Branching
            </Badge>
            <Badge className="px-4 py-2 text-sm" variant="secondary">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              10+ Prompt Templates
            </Badge>
            <Badge className="px-4 py-2 text-sm" variant="secondary">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Custom Personas
            </Badge>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              className="cursor-pointer transition-shadow hover:shadow-lg"
              key={feature.id}
              onClick={() => setActiveDemo(feature.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div
                    className={`rounded-lg p-3 ${feature.color} mb-4 text-white`}
                  >
                    {feature.icon}
                  </div>
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.highlights.map((highlight, index) => (
                    <li className="flex items-start gap-2 text-sm" key={index}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Live Demos */}
        <Separator className="my-12" />

        <div className="mb-8">
          <h2 className="mb-2 font-bold text-3xl">Interactive Demos</h2>
          <p className="text-muted-foreground">
            Click any feature above or select from the tabs below to see it in
            action
          </p>
        </div>

        <Tabs
          onValueChange={setActiveDemo}
          value={activeDemo || "model-comparison"}
        >
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="model-comparison">Compare</TabsTrigger>
            <TabsTrigger value="prompt-library">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="branching">Branching</TabsTrigger>
            <TabsTrigger value="personas">Personas</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
          </TabsList>

          <TabsContent className="mt-6" value="model-comparison">
            <Card>
              <CardHeader>
                <CardTitle>Model Comparison Demo</CardTitle>
                <CardDescription>
                  Compare responses from multiple AI models side-by-side
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[600px]">
                <ModelComparison prompt="Explain quantum computing in simple terms" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-6" value="prompt-library">
            <Card>
              <CardHeader>
                <CardTitle>Prompt Template Library Demo</CardTitle>
                <CardDescription>
                  Browse and use pre-built templates for common tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[600px]">
                <PromptLibrary
                  onSelectTemplate={(template: PromptTemplate) => {
                    alert(
                      `Selected: ${template.title}\n\nTemplate will be applied to your chat input.`
                    );
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-6" value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Usage Analytics Demo</CardTitle>
                <CardDescription>
                  Track usage, costs, and performance metrics (showing mock
                  data)
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[600px]">
                <UsageAnalytics />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-6" value="branching">
            <Card>
              <CardHeader>
                <CardTitle>Conversation Branching Demo</CardTitle>
                <CardDescription>
                  Fork conversations to explore different paths
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[600px]">
                <ConversationBranching
                  branches={MOCK_BRANCHES}
                  chatId="demo"
                  currentBranchId="main"
                  onCreateBranch={(parentId, index, title) => {
                    alert(`Creating branch: ${title}`);
                  }}
                  onDeleteBranch={(branchId) => {
                    alert(`Deleting branch: ${branchId}`);
                  }}
                  onSwitchBranch={(branchId) => {
                    alert(`Switching to branch: ${branchId}`);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-6" value="personas">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>AI Persona Selector</CardTitle>
                  <CardDescription>
                    Choose how the AI should respond
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PersonaSelector
                    allowCustom={true}
                    onPersonaChange={(persona: PersonaConfig) => {
                      setSelectedPersona(persona.id);
                      alert(
                        `Selected persona: ${persona.name}\n\nSystem prompt and temperature will be applied to conversations.`
                      );
                    }}
                    selectedPersonaId={selectedPersona}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                  <CardDescription>Personas change AI behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-semibold">Preset Personas:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>
                        • <strong>Expert Coder:</strong> Low temperature,
                        focused on code quality
                      </li>
                      <li>
                        • <strong>Creative Writer:</strong> High temperature,
                        engaging narratives
                      </li>
                      <li>
                        • <strong>Data Analyst:</strong> Medium temperature,
                        insights-focused
                      </li>
                      <li>
                        • <strong>Patient Tutor:</strong> Educational,
                        step-by-step
                      </li>
                    </ul>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="mb-2 font-semibold">Custom Personas:</h4>
                    <p className="text-muted-foreground text-sm">
                      Create your own personas with custom system prompts and
                      temperature settings for specialized use cases.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className="mt-6" value="models">
            <Card>
              <CardHeader>
                <CardTitle>Available Models</CardTitle>
                <CardDescription>
                  {ENHANCED_MODEL_CATALOG.length} AI models with detailed
                  specifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="grid gap-4 md:grid-cols-2">
                    {ENHANCED_MODEL_CATALOG.map((model) => (
                      <Card key={model.id}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            {getIconComponent(model.iconType)}
                            <CardTitle className="text-base">
                              {model.name}
                            </CardTitle>
                          </div>
                          <CardDescription className="text-xs">
                            {model.provider} •{" "}
                            {model.contextWindow
                              ? `${(model.contextWindow / 1000).toFixed(0)}k context`
                              : ""}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm">{model.description}</p>
                          <div className="flex flex-wrap gap-2">
                            <Badge className="text-xs" variant="secondary">
                              Speed: {model.speed}
                            </Badge>
                            <Badge className="text-xs" variant="secondary">
                              Cost: {model.cost}
                            </Badge>
                          </div>
                          {model.capabilities && (
                            <div className="flex flex-wrap gap-1">
                              {model.capabilities.slice(0, 3).map((cap) => (
                                <Badge
                                  className="text-xs"
                                  key={cap}
                                  variant="outline"
                                >
                                  {cap}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {model.costPerMillion && (
                            <div className="border-t pt-2 text-muted-foreground text-xs">
                              <div>
                                Input: ${model.costPerMillion.input}/M tokens
                              </div>
                              <div>
                                Output: ${model.costPerMillion.output}/M tokens
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* CTA Section */}
      <div className="border-t bg-muted/20">
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="mb-4 font-bold text-3xl">
            Ready to Experience TiQology?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
            These features are already integrated and ready to use. Start
            exploring now!
          </p>
          <div className="flex justify-center gap-4">
            <Button asChild size="lg">
              <a href="/chat">
                Start Chatting
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a
                href="/GALAXY_AI_KILLER_GUIDE.md"
                rel="noopener"
                target="_blank"
              >
                View Documentation
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
