import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function WorkflowDemo() {
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdvice = async () => {
    setLoading(true);
    setAiAdvice(null);
    setTimeout(() => {
      setAiAdvice(
        "AI Advice: Automate repetitive steps in your workflow to save time and reduce errors. Try adding a conditional trigger."
      );
      setLoading(false);
    }, 1000);
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>Workflow Automation</CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="mb-4" disabled={loading} onClick={handleAdvice}>
          {loading ? "Analyzing..." : "Get AI Advice"}
        </Button>
        {aiAdvice && (
          <div className="mt-2 animate-fade-in rounded-lg bg-accent/20 p-4 text-accent-foreground">
            {aiAdvice}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
