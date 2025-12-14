import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

export default function SmartSearchDemo() {
  const [query, setQuery] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    setAiSuggestion(null);
    // Simulate AI feedback
    setTimeout(() => {
      setAiSuggestion(
        `AI Suggestion: Try searching for "${query} trends" for deeper insights.`
      );
      setLoading(false);
    }, 1000);
  };

  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <CardTitle>Intelligent Search</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2">
          <Input
            className="flex-1"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your search..."
            value={query}
          />
          <Button disabled={loading || !query} onClick={handleSearch}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>
        {aiSuggestion && (
          <div className="mt-2 animate-fade-in rounded-lg bg-accent/20 p-4 text-accent-foreground">
            {aiSuggestion}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
