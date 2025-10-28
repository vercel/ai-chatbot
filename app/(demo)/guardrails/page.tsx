"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type GuardrailPhrase,
  type GuardrailTopic,
  MOCK_GUARDRAIL_PHRASES,
  MOCK_GUARDRAIL_TOPICS,
} from "@/lib/mockDiscoveryData";

export default function GuardrailsPage() {
  const [topics, setTopics] = useState<GuardrailTopic[]>(MOCK_GUARDRAIL_TOPICS);
  const [phrases, setPhrases] = useState<GuardrailPhrase[]>(
    MOCK_GUARDRAIL_PHRASES
  );

  const [topicsSearch, setTopicsSearch] = useState("");
  const [phrasesSearch, setPhrasesSearch] = useState("");

  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicValue, setNewTopicValue] = useState("");
  const [newTopicNote, setNewTopicNote] = useState("");

  const [isAddingPhrase, setIsAddingPhrase] = useState(false);
  const [newPhraseValue, setNewPhraseValue] = useState("");
  const [newPhraseHint, setNewPhraseHint] = useState("");

  const [deleteTopicDialog, setDeleteTopicDialog] =
    useState<GuardrailTopic | null>(null);
  const [deletePhraseDialog, setDeletePhraseDialog] =
    useState<GuardrailPhrase | null>(null);

  const [testPrompt, setTestPrompt] = useState("");
  const [testResult, setTestResult] = useState<{
    rawOutput: string;
    status: "PASS" | "FAIL";
    reason: string;
  } | null>(null);

  const filteredTopics = topics.filter(
    (topic) =>
      topic.value.toLowerCase().includes(topicsSearch.toLowerCase()) ||
      topic.note?.toLowerCase().includes(topicsSearch.toLowerCase())
  );

  const filteredPhrases = phrases.filter(
    (phrase) =>
      phrase.value.toLowerCase().includes(phrasesSearch.toLowerCase()) ||
      phrase.rewriteHint?.toLowerCase().includes(phrasesSearch.toLowerCase())
  );

  const handleAddTopic = () => {
    if (!newTopicValue.trim()) {
      return;
    }

    const now = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const newTopic: GuardrailTopic = {
      id: `topic-${Date.now()}`,
      value: newTopicValue,
      note: newTopicNote || undefined,
      createdAt: now,
      createdBy: "Aaron Thomas",
    };

    setTopics((prev) => [newTopic, ...prev]);
    setNewTopicValue("");
    setNewTopicNote("");
    setIsAddingTopic(false);
    toast.success("Topic added");
  };

  const handleDeleteTopic = (topic: GuardrailTopic) => {
    setTopics((prev) => prev.filter((t) => t.id !== topic.id));
    setDeleteTopicDialog(null);
    toast.success("Topic deleted");
  };

  const handleAddPhrase = () => {
    if (!newPhraseValue.trim()) {
      return;
    }

    const now = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const newPhrase: GuardrailPhrase = {
      id: `phrase-${Date.now()}`,
      value: newPhraseValue,
      rewriteHint: newPhraseHint || undefined,
      createdAt: now,
      createdBy: "Aaron Thomas",
    };

    setPhrases((prev) => [newPhrase, ...prev]);
    setNewPhraseValue("");
    setNewPhraseHint("");
    setIsAddingPhrase(false);
    toast.success("Phrase added");
  };

  const handleDeletePhrase = (phrase: GuardrailPhrase) => {
    setPhrases((prev) => prev.filter((p) => p.id !== phrase.id));
    setDeletePhraseDialog(null);
    toast.success("Phrase deleted");
  };

  const handleTestGuardrails = () => {
    if (!testPrompt.trim()) {
      toast.error("Please enter a test prompt");
      return;
    }

    const lowerPrompt = testPrompt.toLowerCase();

    // Check banned topics
    for (const topic of topics) {
      const keywords = topic.value
        .toLowerCase()
        .split(" and ")[0]
        .split(",")[0];
      if (lowerPrompt.includes(keywords.toLowerCase())) {
        setTestResult({
          rawOutput:
            "I appreciate your question, but I prefer not to discuss that topic. Let's focus on healthcare innovation and how we can improve outcomes for patients.",
          status: "PASS",
          reason: `Deflection: PASS — topic matched '${topic.value}'. Glen AI politely declined.`,
        });
        return;
      }
    }

    // Check banned phrases in mock response
    const mockResponse = `That's a wonderful question. Honestly, I think healthcare transformation requires us to focus on value-based care models that reward outcomes rather than volume.`;

    for (const phrase of phrases) {
      if (mockResponse.toLowerCase().includes(phrase.value.toLowerCase())) {
        const cleanedResponse = mockResponse.replace(
          new RegExp(phrase.value, "gi"),
          ""
        );
        setTestResult({
          rawOutput: cleanedResponse.trim(),
          status: "PASS",
          reason: `Deflection: PASS — detected banned phrase "${phrase.value}". ${phrase.rewriteHint ? `Rewrite hint: ${phrase.rewriteHint}` : "Phrase removed."}`,
        });
        return;
      }
    }

    // No violations
    setTestResult({
      rawOutput:
        "Healthcare transformation requires focusing on value-based care models that reward outcomes rather than volume. At Livongo and Transcarent, we've built solutions around this principle—aligning incentives so providers are rewarded for keeping people healthy.",
      status: "FAIL",
      reason:
        "Deflection: FAIL — no guardrail violations detected. Response is clean and passes all checks.",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-bold text-3xl">Guardrails</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Configure topics Glen AI should avoid and phrases to filter from
          responses
        </p>
      </div>

      {/* Test Guardrails - Always visible at top */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-semibold text-lg">
            Test Guardrails
          </CardTitle>
          <CardDescription>
            Test how Glen AI responds with current guardrail settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Enter a test prompt (e.g., 'What do you think about the upcoming election?')"
            rows={3}
            value={testPrompt}
          />
          <Button onClick={handleTestGuardrails}>Test</Button>

          {testResult && (
            <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
              <div>
                <h4 className="mb-2 font-medium text-sm">Raw Output:</h4>
                <p className="text-muted-foreground text-sm">
                  {testResult.rawOutput}
                </p>
              </div>
              <div>
                <h4 className="mb-1 font-medium text-sm">Result:</h4>
                <p className="text-muted-foreground text-sm">
                  {testResult.reason}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Guardrail Configuration */}
      <Tabs className="w-full" defaultValue="topics">
        <TabsList>
          <TabsTrigger value="topics">Out-of-Bounds Topics</TabsTrigger>
          <TabsTrigger value="phrases">Avoid Phrases</TabsTrigger>
        </TabsList>

        {/* Out-of-Bounds Topics Tab */}
        <TabsContent className="space-y-4" value="topics">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="font-semibold text-lg">
                    Out-of-Bounds Topics
                  </CardTitle>
                  <CardDescription>
                    Topics Glen AI should gracefully decline to discuss
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddingTopic(true)}
                  size="sm"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Add Topic
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                onChange={(e) => setTopicsSearch(e.target.value)}
                placeholder="Search topics..."
                value={topicsSearch}
              />

              {isAddingTopic && (
                <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                  <Input
                    onChange={(e) => setNewTopicValue(e.target.value)}
                    placeholder="Topic (e.g., Politics and Political Candidates)"
                    value={newTopicValue}
                  />
                  <Input
                    onChange={(e) => setNewTopicNote(e.target.value)}
                    placeholder="Note (optional)"
                    value={newTopicNote}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddTopic} size="sm">
                      Add
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAddingTopic(false);
                        setNewTopicValue("");
                        setNewTopicNote("");
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Note</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTopics.length === 0 ? (
                      <TableRow>
                        <TableCell
                          className="h-24 text-center text-muted-foreground"
                          colSpan={5}
                        >
                          No topics found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTopics.map((topic) => (
                        <TableRow className="hover:bg-accent/30" key={topic.id}>
                          <TableCell className="py-4 font-medium">
                            {topic.value}
                          </TableCell>
                          <TableCell className="py-4 text-muted-foreground text-sm">
                            {topic.note || "—"}
                          </TableCell>
                          <TableCell className="py-4 text-muted-foreground text-sm">
                            {topic.createdAt}
                          </TableCell>
                          <TableCell className="py-4 text-muted-foreground text-sm">
                            {topic.createdBy}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex gap-1">
                              <Button
                                onClick={() => setDeleteTopicDialog(topic)}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Avoid Phrases Tab */}
        <TabsContent className="space-y-4" value="phrases">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="font-semibold text-lg">
                    Avoid Phrases
                  </CardTitle>
                  <CardDescription>
                    Phrases to remove or rewrite in Glen AI's responses
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsAddingPhrase(true)}
                  size="sm"
                  type="button"
                >
                  <Plus className="h-4 w-4" />
                  Add Phrase
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                onChange={(e) => setPhrasesSearch(e.target.value)}
                placeholder="Search phrases..."
                value={phrasesSearch}
              />

              {isAddingPhrase && (
                <div className="space-y-3 rounded-lg border bg-muted/50 p-4">
                  <Input
                    onChange={(e) => setNewPhraseValue(e.target.value)}
                    placeholder="Phrase (e.g., That's a wonderful question)"
                    value={newPhraseValue}
                  />
                  <Input
                    onChange={(e) => setNewPhraseHint(e.target.value)}
                    placeholder="Rewrite hint (e.g., Just answer directly)"
                    value={newPhraseHint}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddPhrase} size="sm">
                      Add
                    </Button>
                    <Button
                      onClick={() => {
                        setIsAddingPhrase(false);
                        setNewPhraseValue("");
                        setNewPhraseHint("");
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phrase</TableHead>
                      <TableHead>Rewrite Hint</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPhrases.length === 0 ? (
                      <TableRow>
                        <TableCell
                          className="h-24 text-center text-muted-foreground"
                          colSpan={5}
                        >
                          No phrases found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPhrases.map((phrase) => (
                        <TableRow
                          className="hover:bg-accent/30"
                          key={phrase.id}
                        >
                          <TableCell className="py-4 font-medium">
                            {phrase.value}
                          </TableCell>
                          <TableCell className="py-4 text-muted-foreground text-sm">
                            {phrase.rewriteHint || "—"}
                          </TableCell>
                          <TableCell className="py-4 text-muted-foreground text-sm">
                            {phrase.createdAt}
                          </TableCell>
                          <TableCell className="py-4 text-muted-foreground text-sm">
                            {phrase.createdBy}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex gap-1">
                              <Button
                                onClick={() => setDeletePhraseDialog(phrase)}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Topic Dialog */}
      <AlertDialog
        onOpenChange={(open) => !open && setDeleteTopicDialog(null)}
        open={!!deleteTopicDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTopicDialog?.value}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteTopicDialog && handleDeleteTopic(deleteTopicDialog)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Phrase Dialog */}
      <AlertDialog
        onOpenChange={(open) => !open && setDeletePhraseDialog(null)}
        open={!!deletePhraseDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Phrase?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletePhraseDialog?.value}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletePhraseDialog && handleDeletePhrase(deletePhraseDialog)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
