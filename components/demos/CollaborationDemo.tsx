import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function CollaborationDemo() {
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTip = async () => {
    setLoading(true);
    setAiTip(null);
    setTimeout(() => {
      setAiTip(
        "AI Tip: Invite your teammates to co-edit this document for faster results and richer feedback."
      );
      setLoading(false);
    }, 1000);
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>Real-Time Collaboration</CardTitle>
      </CardHeader>
      <CardContent>
        <Button className="mb-4" disabled={loading} onClick={handleTip}>
          {loading ? "Thinking..." : "Get AI Tip"}
        </Button>
        {aiTip && (
          <div className="mt-2 animate-fade-in rounded-lg bg-accent/20 p-4 text-accent-foreground">
            {aiTip}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
