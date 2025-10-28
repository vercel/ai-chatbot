"use client";

import {
  Clock,
  FileText,
  Link as LinkIcon,
  Loader2,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  MOCK_INSIGHT_CHUNKS,
  MOCK_UPLOADED_CONTENT,
  type UploadedContent,
} from "@/lib/mockDiscoveryData";

export default function KnowledgePage() {
  const router = useRouter();
  const [uploadedContent, setUploadedContent] = useState<UploadedContent[]>(
    MOCK_UPLOADED_CONTENT
  );
  const [addContentOpen, setAddContentOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"file" | "url" | "text">("file");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanTime, setLastScanTime] = useState("Oct 27, 2024, 2:30 PM");

  // Form state
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");

  // Delete confirmation
  const [deleteItem, setDeleteItem] = useState<UploadedContent | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // View Insights modal
  const [viewInsightsItem, setViewInsightsItem] =
    useState<UploadedContent | null>(null);
  const [viewInsightsOpen, setViewInsightsOpen] = useState(false);

  const resetForm = () => {
    setFileInput(null);
    setUrlInput("");
    setTextInput("");
    setActiveTab("file");
  };

  const handleSubmit = () => {
    setIsProcessing(true);
    toast.info("Processing content...");

    setTimeout(() => {
      const chunksGenerated = Math.floor(Math.random() * 3) + 3; // 3-5 insights
      const now = new Date();
      const dateStr = now.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      let newContent: UploadedContent | null = null;
      let contentName = "";

      if (activeTab === "file" && fileInput) {
        const fileType = fileInput.type.includes("pdf")
          ? "pdf"
          : fileInput.type.includes("video")
            ? "video"
            : "text";
        contentName = fileInput.name;
        newContent = {
          id: `upload-${Date.now()}`,
          name: contentName,
          type: fileType,
          uploadedAt: dateStr,
          uploadedBy: "You",
          chunksGenerated,
          chunkIds: [],
        };
      } else if (activeTab === "url" && urlInput) {
        try {
          contentName = new URL(urlInput).hostname;
        } catch {
          contentName = "URL Content";
        }
        newContent = {
          id: `upload-${Date.now()}`,
          name: contentName,
          type: "url",
          uploadedAt: dateStr,
          uploadedBy: "You",
          chunksGenerated,
          chunkIds: [],
        };
      } else if (activeTab === "text" && textInput) {
        contentName = `Text: ${textInput.slice(0, 30)}...`;
        newContent = {
          id: `upload-${Date.now()}`,
          name: contentName,
          type: "text",
          uploadedAt: dateStr,
          uploadedBy: "You",
          chunksGenerated,
          chunkIds: [],
        };
      }

      if (newContent) {
        setUploadedContent((prev) => [newContent!, ...prev]);
        setLastScanTime(dateStr);
        toast.success(
          `Generated ${chunksGenerated} insights - review in Knowledge`
        );
      }

      setIsProcessing(false);
      setAddContentOpen(false);
      resetForm();
    }, 1500);
  };

  const handleViewInsights = (content: UploadedContent) => {
    setViewInsightsItem(content);
    setViewInsightsOpen(true);
  };

  const handleDelete = () => {
    if (deleteItem) {
      setUploadedContent((prev) =>
        prev.filter((item) => item.id !== deleteItem.id)
      );
      toast.success(`"${deleteItem.name}" has been deleted`);
      setDeleteDialogOpen(false);
      setDeleteItem(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "pdf":
      case "text":
        return <FileText className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "url":
        return <LinkIcon className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const canSubmit = () => {
    if (activeTab === "file") return fileInput !== null;
    if (activeTab === "url") return urlInput.trim() !== "";
    if (activeTab === "text") return textInput.trim() !== "";
    return false;
  };

  // Get mock insights for the selected content
  const getInsightsForContent = (content: UploadedContent) => {
    // In a real app, this would filter by chunkIds
    // For mock, just show first few insights with this content's name in sourceName
    return MOCK_INSIGHT_CHUNKS.filter(
      (chunk) =>
        chunk.sourceName
          .toLowerCase()
          .includes(content.name.toLowerCase().split(".")[0]) ||
        Math.random() > 0.7 // randomly include some
    ).slice(0, content.chunksGenerated);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-bold text-3xl">Content Library</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Manage uploaded files, URLs, and text that generate insights
          </p>
          <div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
            <Clock className="h-3 w-3" />
            <span>Last content added: {lastScanTime}</span>
          </div>
        </div>
        <Dialog onOpenChange={setAddContentOpen} open={addContentOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Add Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Content</DialogTitle>
              <DialogDescription>
                Upload content to generate insights for Glen AI
              </DialogDescription>
            </DialogHeader>

            <Tabs
              onValueChange={(v) => setActiveTab(v as "file" | "url" | "text")}
              value={activeTab}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="file">File</TabsTrigger>
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="text">Text</TabsTrigger>
              </TabsList>

              <TabsContent className="space-y-4" value="file">
                <div className="space-y-2">
                  <Label htmlFor="file-input">File</Label>
                  <Input
                    accept="application/pdf,.pdf,video/*,.txt,.doc,.docx"
                    id="file-input"
                    onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                    type="file"
                  />
                  <p className="text-muted-foreground text-xs">
                    Accepts PDF, video, and text files
                  </p>
                </div>
              </TabsContent>

              <TabsContent className="space-y-4" value="url">
                <div className="space-y-2">
                  <Label htmlFor="url-input">URL</Label>
                  <Input
                    id="url-input"
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/article"
                    type="url"
                    value={urlInput}
                  />
                  <p className="text-muted-foreground text-xs">
                    Enter a URL to scrape and extract insights from
                  </p>
                </div>
              </TabsContent>

              <TabsContent className="space-y-4" value="text">
                <div className="space-y-2">
                  <Label htmlFor="text-input">Content</Label>
                  <Textarea
                    id="text-input"
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste your text content here..."
                    rows={8}
                    value={textInput}
                  />
                  <p className="text-muted-foreground text-xs">
                    Paste any text content (transcript, article, notes, etc.)
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                onClick={() => setAddContentOpen(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={!canSubmit() || isProcessing}
                onClick={handleSubmit}
              >
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content Table */}
      {uploadedContent.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="mt-6 mb-2 font-medium text-lg">
            No content uploaded yet
          </h3>
          <p className="mb-4 max-w-sm text-muted-foreground text-sm">
            Add your first content to get started.
          </p>
          <Button onClick={() => setAddContentOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Content
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Uploaded Date</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead className="text-right">Insights Generated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {uploadedContent.map((content) => (
                <TableRow className="hover:bg-accent/30" key={content.id}>
                  <TableCell className="py-4 font-medium">
                    {content.name}
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(content.type)}
                      <span className="capitalize">{content.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-muted-foreground">
                    {content.uploadedAt}
                  </TableCell>
                  <TableCell className="py-4 text-muted-foreground">
                    {content.uploadedBy}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    {content.chunksGenerated}
                  </TableCell>
                  <TableCell className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => handleViewInsights(content)}
                        size="sm"
                        variant="ghost"
                      >
                        View Insights
                      </Button>
                      <Button
                        onClick={() => {
                          setDeleteItem(content);
                          setDeleteDialogOpen(true);
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Insights Dialog */}
      <Dialog onOpenChange={setViewInsightsOpen} open={viewInsightsOpen}>
        <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Insights from "{viewInsightsItem?.name}"</DialogTitle>
            <DialogDescription>
              {viewInsightsItem?.chunksGenerated} insights generated from this
              content
            </DialogDescription>
          </DialogHeader>

          {viewInsightsItem && (
            <div className="space-y-4 py-4">
              {getInsightsForContent(viewInsightsItem).map((insight) => (
                <div
                  className="space-y-3 rounded-lg border p-4 shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                  key={insight.id}
                  onClick={() => {
                    // Navigate to Knowledge page and open this insight
                    router.push(`/discovery?insight=${insight.id}`);
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-base">
                        {insight.title}
                      </h4>
                      <p className="mt-2 text-muted-foreground text-sm">
                        {insight.meaning}
                      </p>
                    </div>
                    <Badge
                      className={
                        insight.status === "pending"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : insight.status === "live"
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-400"
                      }
                      variant="outline"
                    >
                      {insight.status.charAt(0).toUpperCase() +
                        insight.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="rounded bg-muted/30 p-3 text-sm">
                    <span className="font-medium text-muted-foreground">
                      Quote:{" "}
                    </span>
                    "{insight.quote}"
                  </div>
                </div>
              ))}
              {getInsightsForContent(viewInsightsItem).length === 0 && (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  No insights found for this content
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setViewInsightsOpen(false)}
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Content</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this content? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteItem && (
            <div className="rounded-lg bg-muted p-4">
              <div className="font-medium text-sm">{deleteItem.name}</div>
              <div className="mt-1 text-muted-foreground text-xs">
                {deleteItem.chunksGenerated} insights generated
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
