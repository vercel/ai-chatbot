import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function AIAssistantDemo() {
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    setLoading(true);
    setAiResponse(null);
    setTimeout(() => {
      setAiResponse(
        "AI Assistant: How can I help you today? Try asking about workflow tips, data insights, or collaboration features."
      );
      setLoading(false);
    }, 1000);
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>AI Assistant</CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="mb-4" disabled={loading} onClick={handleAsk}>
          {loading ? "Thinking..." : "Ask AI Assistant"}
        </Button>
        {aiResponse && (
          <div className="mt-2 animate-fade-in rounded-lg bg-accent/20 p-4 text-accent-foreground">
            {aiResponse}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
