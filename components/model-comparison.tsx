"use client";

import { Plus, RefreshCw, Split, X } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  COST_CONFIG,
  ENHANCED_MODEL_CATALOG,
  type EnhancedModelInfo,
  SPEED_CONFIG,
} from "@/lib/ai/enhanced-models";
import { getIconComponent } from "@/lib/ai/icon-utils";

interface ModelComparisonProps {
  prompt: string;
  onClose?: () => void;
}

interface ComparisonResult {
  modelId: string;
  response: string;
  loading: boolean;
  error?: string;
  tokens?: { input: number; output: number };
  duration?: number;
}

export function ModelComparison({ prompt, onClose }: ModelComparisonProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "chat-model",
    "gpt-4o",
  ]);
  const [results, setResults] = useState<Record<string, ComparisonResult>>({});
  const [isRunning, setIsRunning] = useState(false);

  const addModel = (modelId: string) => {
    if (selectedModels.length < 4 && !selectedModels.includes(modelId)) {
      setSelectedModels([...selectedModels, modelId]);
    }
  };

  const removeModel = (modelId: string) => {
    setSelectedModels(selectedModels.filter((id) => id !== modelId));
    const newResults = { ...results };
    delete newResults[modelId];
    setResults(newResults);
  };

  const runComparison = async () => {
    setIsRunning(true);

    // Initialize loading states
    const initialResults: Record<string, ComparisonResult> = {};
    selectedModels.forEach((modelId) => {
      initialResults[modelId] = {
        modelId,
        response: "",
        loading: true,
      };
    });
    setResults(initialResults);

    // Run comparisons in parallel
    const promises = selectedModels.map(async (modelId) => {
      const startTime = Date.now();
      try {
        // TODO: Integrate with actual API
        // For now, simulate API call
        await new Promise((resolve) =>
          setTimeout(resolve, 2000 + Math.random() * 2000)
        );

        const model = ENHANCED_MODEL_CATALOG.find((m) => m.id === modelId);
        const mockResponse = `This is a mock response from ${model?.name}.\n\nPrompt: "${prompt}"\n\nThis would be the actual AI-generated response in production. Each model would provide its unique perspective and answer style.`;

        return {
          modelId,
          response: mockResponse,
          loading: false,
          tokens: {
            input: Math.floor(prompt.length / 4),
            output: Math.floor(mockResponse.length / 4),
          },
          duration: Date.now() - startTime,
        };
      } catch (error) {
        return {
          modelId,
          response: "",
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    const completedResults = await Promise.all(promises);
    const resultsMap: Record<string, ComparisonResult> = {};
    completedResults.forEach((result) => {
      resultsMap[result.modelId] = result;
    });
    setResults(resultsMap);
    setIsRunning(false);
  };

  const availableModels = ENHANCED_MODEL_CATALOG.filter(
    (m) => !selectedModels.includes(m.id)
  );

  const getModelInfo = (modelId: string): EnhancedModelInfo | undefined => {
    return ENHANCED_MODEL_CATALOG.find((m) => m.id === modelId);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <Split className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Model Comparison</h2>
          <Badge variant="secondary">{selectedModels.length} models</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={isRunning || selectedModels.length === 0}
            onClick={runComparison}
            size="sm"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRunning ? "animate-spin" : ""}`}
            />
            {isRunning ? "Running..." : "Compare"}
          </Button>
          {onClose && (
            <Button onClick={onClose} size="icon" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Prompt Display */}
      <div className="border-b bg-muted/50 p-4">
        <p className="mb-1 text-muted-foreground text-sm">Prompt:</p>
        <p className="text-sm">{prompt}</p>
      </div>

      {/* Model Selection */}
      <div className="border-b p-4">
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedModels.map((modelId) => {
            const model = getModelInfo(modelId);
            return (
              <Badge className="gap-1 pr-1" key={modelId} variant="outline">
                {getIconComponent(model?.iconType)}
                {model?.name}
                <Button
                  className="ml-1 h-4 w-4"
                  onClick={() => removeModel(modelId)}
                  size="icon"
                  variant="ghost"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
          {selectedModels.length < 4 && (
            <Badge className="gap-1" variant="outline">
              <Plus className="h-3 w-3" />
              Add Model
            </Badge>
          )}
        </div>
        {selectedModels.length < 4 && availableModels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {availableModels.slice(0, 5).map((model) => (
              <Button
                className="h-7 text-xs"
                key={model.id}
                onClick={() => addModel(model.id)}
                size="sm"
                variant="ghost"
              >
                {getIconComponent(model.iconType)}
                {model.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Results Grid */}
      <ScrollArea className="flex-1">
        <div
          className={`grid gap-4 p-4 ${
            selectedModels.length === 1
              ? "grid-cols-1"
              : selectedModels.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {selectedModels.map((modelId) => {
            const model = getModelInfo(modelId);
            const result = results[modelId];

            return (
              <Card className="flex flex-col" key={modelId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getIconComponent(model?.iconType)}
                      <CardTitle className="text-base">{model?.name}</CardTitle>
                    </div>
                    <Button
                      className="h-6 w-6"
                      onClick={() => removeModel(modelId)}
                      size="icon"
                      variant="ghost"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    {model?.provider}
                  </CardDescription>
                  {model && (
                    <div className="mt-2 flex gap-1.5">
                      <Badge
                        className={`h-5 px-1.5 text-xs ${SPEED_CONFIG[model.speed || "medium"].color}`}
                        variant="secondary"
                      >
                        {getIconComponent(SPEED_CONFIG[model.speed || "medium"].iconType, "h-3 w-3")}
                        {model.speed}
                      </Badge>
                      <Badge
                        className={`h-5 px-1.5 text-xs ${COST_CONFIG[model.cost || "medium"].color}`}
                        variant="secondary"
                      >
                        {getIconComponent(COST_CONFIG[model.cost || "medium"].iconType, "h-3 w-3")}${model.cost}
                      </Badge>
                    </div>
                  )}
                </CardHeader>
                <Separator />
                <CardContent className="flex-1 pt-4">
                  {result?.loading && (
                    <div className="flex h-32 items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  {result?.error && (
                    <div className="text-destructive text-sm">
                      Error: {result.error}
                    </div>
                  )}
                  {result?.response && (
                    <>
                      <div className="mb-4 whitespace-pre-wrap text-sm">
                        {result.response}
                      </div>
                      {result.tokens && result.duration && (
                        <div className="flex gap-2 border-t pt-2 text-muted-foreground text-xs">
                          <span>
                            Tokens: {result.tokens.input + result.tokens.output}
                          </span>
                          <span>•</span>
                          <span>
                            Time: {(result.duration / 1000).toFixed(2)}s
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {!result && (
                    <div className="text-muted-foreground text-sm">
                      Click "Compare" to run
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
