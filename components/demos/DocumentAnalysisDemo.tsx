import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function DocumentAnalysisDemo() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setFeedback(null);
    // Simulate AI feedback
    setTimeout(() => {
      setFeedback(
        "AI Insight: This document contains actionable insights and positive sentiment. Consider sharing with your team."
      );
      setLoading(false);
    }, 1200);
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>Smart Document Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="mb-4" disabled={loading} onClick={handleAnalyze}>
          {loading ? "Analyzing..." : "Analyze Document"}
        </Button>
        {feedback && (
          <div className="mt-2 animate-fade-in rounded-lg bg-accent/20 p-4 text-accent-foreground">
            {feedback}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
