"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Code,
  Download,
  Eye,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface AnalysisResult {
  description: string;
  objects: string[];
  text?: string;
  colors: string[];
  emotions?: string[];
  suggestions?: string[];
}

interface UIAnalysis {
  issues: Array<{
    type: string;
    severity: "high" | "medium" | "low";
    description: string;
    fix: string;
  }>;
  code?: {
    detected: boolean;
    language: string;
    snippet: string;
  };
}

export function VisionStudio() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [uiAnalysis, setUIAnalysis] = useState<UIAnalysis | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [activeTab, setActiveTab] = useState("analyze");

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setSelectedImage(event.target?.result as string);
          setAnalysis(null);
          setUIAnalysis(null);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setLoading(true);
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze",
          data: { imageUrl: selectedImage },
        }),
      });

      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeUIScreenshot = async () => {
    if (!selectedImage) return;

    setLoading(true);
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "analyze-screenshot",
          data: { imageUrl: selectedImage },
        }),
      });

      const data = await res.json();
      setUIAnalysis(data.analysis);
    } catch (error) {
      console.error("UI analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          data: {
            prompt,
            style: "3d-render",
            quality: "hd",
          },
        }),
      });

      const data = await res.json();
      if (data.images) {
        setGeneratedImages([...generatedImages, ...data.images]);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-3">
            <Eye className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-2xl">Vision Studio</h1>
            <p className="text-muted-foreground">
              Analyze, understand, and generate images with AI
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge className="px-4 py-2" variant="outline">
            GPT-4 Vision
          </Badge>
          <Badge className="px-4 py-2" variant="outline">
            DALL-E 3
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analyze">
            <Eye className="mr-2 h-4 w-4" />
            Analyze
          </TabsTrigger>
          <TabsTrigger value="ui">
            <Code className="mr-2 h-4 w-4" />
            UI Analysis
          </TabsTrigger>
          <TabsTrigger value="generate">
            <Wand2 className="mr-2 h-4 w-4" />
            Generate
          </TabsTrigger>
        </TabsList>

        {/* Analyze Tab */}
        <TabsContent className="space-y-4" value="analyze">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Upload Area */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-lg">Upload Image</h3>
              {selectedImage ? (
                <div className="space-y-4">
                  <div className="relative h-64 overflow-hidden rounded-lg">
                    <img
                      alt="Preview"
                      className="h-full w-full object-contain"
                      src={selectedImage}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      disabled={loading}
                      onClick={analyzeImage}
                    >
                      {loading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze Image
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setSelectedImage(null)}
                      variant="outline"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary">
                  <Upload className="mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    Click to upload or drag and drop
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    PNG, JPG, WebP up to 10MB
                  </p>
                  <input
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    type="file"
                  />
                </label>
              )}
            </Card>

            {/* Analysis Results */}
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-lg">Analysis Results</h3>
              {analysis ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium">Description</h4>
                    <p className="text-muted-foreground text-sm">
                      {analysis.description}
                    </p>
                  </div>

                  {analysis.objects && analysis.objects.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-medium">Detected Objects</h4>
                      <div className="flex flex-wrap gap-2">
                        {analysis.objects.map((obj, idx) => (
                          <Badge key={idx} variant="secondary">
                            {obj}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.colors && analysis.colors.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-medium">Dominant Colors</h4>
                      <div className="flex gap-2">
                        {analysis.colors.map((color, idx) => (
                          <div
                            className="h-12 w-12 rounded-lg border shadow-sm"
                            key={idx}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div>
                      <h4 className="mb-2 font-medium">AI Suggestions</h4>
                      <ul className="space-y-1 text-sm">
                        {analysis.suggestions.map((suggestion, idx) => (
                          <li className="flex items-start gap-2" key={idx}>
                            <Zap className="mt-0.5 h-4 w-4 text-yellow-500" />
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                  <Eye className="mb-2 h-12 w-12 opacity-20" />
                  <p>Upload and analyze an image to see results</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* UI Analysis Tab */}
        <TabsContent className="space-y-4" value="ui">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-lg">Screenshot</h3>
              {selectedImage ? (
                <div className="space-y-4">
                  <div className="relative h-96 overflow-hidden rounded-lg border">
                    <img
                      alt="UI Screenshot"
                      className="h-full w-full object-contain"
                      src={selectedImage}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={loading}
                    onClick={analyzeUIScreenshot}
                  >
                    {loading ? "Analyzing UI..." : "Analyze UI/UX"}
                  </Button>
                </div>
              ) : (
                <label className="flex h-96 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary">
                  <Upload className="mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    Upload UI screenshot
                  </p>
                  <input
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    type="file"
                  />
                </label>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-lg">
                UI/UX Issues & Fixes
              </h3>
              {uiAnalysis ? (
                <div className="max-h-96 space-y-4 overflow-y-auto">
                  {uiAnalysis.issues.map((issue, idx) => (
                    <motion.div
                      animate={{ opacity: 1, x: 0 }}
                      className={`rounded-lg border-l-4 p-4 ${
                        issue.severity === "high"
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : issue.severity === "medium"
                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                            : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      key={idx}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <Badge
                          className="capitalize"
                          variant={
                            issue.severity === "high"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {issue.severity}
                        </Badge>
                        <span className="text-muted-foreground text-xs uppercase">
                          {issue.type}
                        </span>
                      </div>
                      <p className="mb-1 font-medium text-sm">
                        {issue.description}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        <strong>Fix:</strong> {issue.fix}
                      </p>
                    </motion.div>
                  ))}

                  {uiAnalysis.code?.detected && (
                    <div className="mt-4 rounded-lg bg-secondary/50 p-4">
                      <h4 className="mb-2 font-medium">
                        Extracted Code ({uiAnalysis.code.language})
                      </h4>
                      <pre className="overflow-x-auto rounded border bg-background p-3 text-xs">
                        <code>{uiAnalysis.code.snippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-96 flex-col items-center justify-center text-muted-foreground">
                  <Code className="mb-2 h-12 w-12 opacity-20" />
                  <p>Upload a UI screenshot to get feedback</p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent className="space-y-4" value="generate">
          <Card className="p-6">
            <h3 className="mb-4 font-semibold text-lg">
              Generate Images with DALL-E 3
            </h3>
            <div className="space-y-4">
              <Textarea
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to generate... (e.g., 'A futuristic AI holographic interface with floating 3D data visualization')"
                rows={4}
                value={prompt}
              />
              <Button
                className="w-full"
                disabled={loading || !prompt.trim()}
                onClick={generateImage}
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-white border-b-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>
          </Card>

          {generatedImages.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-4 font-semibold text-lg">Generated Images</h3>
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((img, idx) => (
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="group relative"
                    initial={{ opacity: 0, scale: 0.9 }}
                    key={idx}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <img
                      alt={`Generated ${idx + 1}`}
                      className="h-64 w-full rounded-lg object-cover"
                      src={img}
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="sm" variant="secondary">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
