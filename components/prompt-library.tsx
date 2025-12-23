"use client";

import {
  Brain,
  Bug,
  Check,
  Code,
  Copy,
  FileText,
  MessageSquare,
  Pen,
  Search,
  Sparkles,
  Star,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category:
    | "coding"
    | "writing"
    | "analysis"
    | "creative"
    | "business"
    | "other";
  template: string;
  variables?: string[];
  icon?: React.ReactNode;
  tags?: string[];
  favorite?: boolean;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "code-review",
    title: "Code Review",
    description: "Comprehensive code review with best practices",
    category: "coding",
    template: `Please review this code and provide:
1. Code quality assessment
2. Potential bugs or issues
3. Performance optimizations
4. Best practice recommendations
5. Security concerns

Code:
\`\`\`{{language}}
{{code}}
\`\`\``,
    variables: ["language", "code"],
    icon: <Code className="h-4 w-4" />,
    tags: ["code", "review", "quality"],
  },
  {
    id: "debug-help",
    title: "Debug Assistant",
    description: "Help debug code with error analysis",
    category: "coding",
    template: `I'm encountering an error in my {{language}} code. Please help me debug it.

Error:
{{error}}

Code:
\`\`\`{{language}}
{{code}}
\`\`\`

Please:
1. Identify the root cause
2. Explain why it's happening
3. Provide a fix
4. Suggest how to prevent similar issues`,
    variables: ["language", "error", "code"],
    icon: <Bug className="h-4 w-4" />,
    tags: ["debug", "error", "troubleshoot"],
  },
  {
    id: "refactor-code",
    title: "Code Refactoring",
    description: "Refactor code for better maintainability",
    category: "coding",
    template: `Please refactor this {{language}} code to:
1. Improve readability
2. Enhance maintainability
3. Follow {{language}} best practices
4. Optimize performance
5. Add appropriate comments

Current code:
\`\`\`{{language}}
{{code}}
\`\`\``,
    variables: ["language", "code"],
    icon: <Code className="h-4 w-4" />,
    tags: ["refactor", "clean code", "optimization"],
  },
  {
    id: "write-tests",
    title: "Write Tests",
    description: "Generate comprehensive unit tests",
    category: "coding",
    template: `Write comprehensive unit tests for this {{language}} code using {{testFramework}}.

Code to test:
\`\`\`{{language}}
{{code}}
\`\`\`

Include:
1. Happy path tests
2. Edge cases
3. Error handling
4. Mock external dependencies
5. Clear test descriptions`,
    variables: ["language", "testFramework", "code"],
    icon: <FileText className="h-4 w-4" />,
    tags: ["testing", "unit tests", "TDD"],
  },
  {
    id: "explain-code",
    title: "Explain Code",
    description: "Detailed explanation of how code works",
    category: "coding",
    template: `Please explain this {{language}} code in detail:

\`\`\`{{language}}
{{code}}
\`\`\`

Include:
1. Overall purpose and functionality
2. Line-by-line explanation of key sections
3. Data flow and logic
4. Any design patterns used
5. Potential improvements`,
    variables: ["language", "code"],
    icon: <Brain className="h-4 w-4" />,
    tags: ["explain", "learn", "documentation"],
  },
  {
    id: "blog-post",
    title: "Blog Post Writer",
    description: "Create engaging blog posts",
    category: "writing",
    template: `Write a comprehensive blog post about: {{topic}}

Target audience: {{audience}}
Tone: {{tone}}
Length: {{wordCount}} words

Include:
1. Catchy title and introduction
2. Well-structured sections with headers
3. Examples and practical insights
4. Engaging conclusion with call-to-action
5. SEO-friendly content`,
    variables: ["topic", "audience", "tone", "wordCount"],
    icon: <Pen className="h-4 w-4" />,
    tags: ["writing", "blog", "content"],
  },
  {
    id: "email-draft",
    title: "Professional Email",
    description: "Draft professional emails",
    category: "business",
    template: `Draft a professional email:

Purpose: {{purpose}}
Recipient: {{recipient}}
Tone: {{tone}}

Key points to include:
{{keyPoints}}

Please make it:
1. Professional and polite
2. Clear and concise
3. Action-oriented
4. Grammatically perfect`,
    variables: ["purpose", "recipient", "tone", "keyPoints"],
    icon: <MessageSquare className="h-4 w-4" />,
    tags: ["email", "business", "communication"],
  },
  {
    id: "data-analysis",
    title: "Data Analysis",
    description: "Analyze data and provide insights",
    category: "analysis",
    template: `Analyze this data and provide insights:

Data: {{data}}

Please provide:
1. Summary statistics
2. Key trends and patterns
3. Notable outliers or anomalies
4. Actionable insights
5. Visualization recommendations
6. Next steps for deeper analysis`,
    variables: ["data"],
    icon: <Brain className="h-4 w-4" />,
    tags: ["analysis", "data", "insights"],
  },
  {
    id: "creative-story",
    title: "Creative Story",
    description: "Generate creative stories",
    category: "creative",
    template: `Write a creative story with these elements:

Genre: {{genre}}
Setting: {{setting}}
Main character: {{character}}
Conflict: {{conflict}}
Length: {{length}} words

Make it engaging with:
1. Strong narrative arc
2. Vivid descriptions
3. Character development
4. Compelling dialogue
5. Satisfying resolution`,
    variables: ["genre", "setting", "character", "conflict", "length"],
    icon: <Sparkles className="h-4 w-4" />,
    tags: ["creative", "story", "fiction"],
  },
  {
    id: "summarize",
    title: "Summarize Content",
    description: "Create concise summaries",
    category: "analysis",
    template: `Summarize the following content:

{{content}}

Provide:
1. Executive summary (2-3 sentences)
2. Key points (bullet list)
3. Important details
4. Main takeaways
5. {{summaryLength}} version`,
    variables: ["content", "summaryLength"],
    icon: <FileText className="h-4 w-4" />,
    tags: ["summary", "analysis", "tldr"],
  },
];

interface PromptLibraryProps {
  onSelectTemplate?: (template: PromptTemplate) => void;
}

export function PromptLibrary({ onSelectTemplate }: PromptLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = [
    "all",
    "coding",
    "writing",
    "analysis",
    "creative",
    "business",
  ];

  const filteredTemplates = PROMPT_TEMPLATES.filter((template) => {
    const matchesSearch =
      searchQuery === "" ||
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const copyTemplate = async (template: PromptTemplate) => {
    await navigator.clipboard.writeText(template.template);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="space-y-4 border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h2 className="font-semibold text-lg">Prompt Library</h2>
            <Badge variant="secondary">
              {filteredTemplates.length} templates
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            value={searchQuery}
          />
        </div>

        {/* Category Tabs */}
        <Tabs onValueChange={setSelectedCategory} value={selectedCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {categories.map((category) => (
              <TabsTrigger
                className="capitalize"
                key={category}
                value={category}
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Templates Grid */}
      <ScrollArea className="flex-1">
        <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card
              className="flex flex-col transition-shadow hover:shadow-md"
              key={template.id}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {template.icon}
                    <CardTitle className="text-base">
                      {template.title}
                    </CardTitle>
                  </div>
                  {template.favorite && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
                <CardDescription className="text-xs">
                  {template.description}
                </CardDescription>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Badge className="text-xs capitalize" variant="outline">
                    {template.category}
                  </Badge>
                  {template.tags?.slice(0, 2).map((tag) => (
                    <Badge className="text-xs" key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => onSelectTemplate?.(template)}
                    size="sm"
                    variant="default"
                  >
                    Use Template
                  </Button>
                  <Button
                    onClick={() => copyTemplate(template)}
                    size="sm"
                    variant="outline"
                  >
                    {copiedId === template.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <Search className="mb-4 h-12 w-12" />
            <p>No templates found</p>
            <p className="text-sm">Try a different search or category</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// Export for use in other components
export { PROMPT_TEMPLATES };
