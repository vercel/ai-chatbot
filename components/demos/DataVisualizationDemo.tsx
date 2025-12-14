import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function DataVisualizationDemo() {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInsight = async () => {
    setLoading(true);
    setAiInsight(null);
    setTimeout(() => {
      setAiInsight(
        "AI Insight: Your data shows a 20% increase in engagement this quarter. Visualize trends for deeper analysis."
      );
      setLoading(false);
    }, 1200);
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>Data Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="mb-4" disabled={loading} onClick={handleInsight}>
          {loading ? "Analyzing..." : "Get AI Insight"}
        </Button>
        {aiInsight && (
          <div className="mt-2 animate-fade-in rounded-lg bg-accent/20 p-4 text-accent-foreground">
            {aiInsight}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
