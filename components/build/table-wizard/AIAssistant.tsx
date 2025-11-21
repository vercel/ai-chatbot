"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FieldMetadata } from "@/lib/build/table-wizard/types";

type AIAssistantProps = {
  type: "fields" | "relationships" | "policies";
  description: string;
  onGenerate: (fields: FieldMetadata[]) => void;
};

export function AIAssistant({
  type,
  description,
  onGenerate,
}: AIAssistantProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ai/generate-table-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ description, type }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate fields");
      }

      const data = await response.json();
      onGenerate(data.fields || []);
    } catch (error) {
      console.error("AI generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (type !== "fields") {
    return null; // Only fields generation for now
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGenerate}
      disabled={loading || !description.trim()}
      size="sm"
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Fields with AI
        </>
      )}
    </Button>
  );
}

