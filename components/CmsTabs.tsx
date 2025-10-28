"use client";

import {
  Calendar,
  CheckCircle,
  Eye,
  History,
  Info,
  Loader2,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Doc, ScanMetadata, ScanSchedule, ScanSource } from "@/lib/types";
import AuditTrailDialog from "./AuditTrailDialog";
import KnowledgePreviewDialog from "./KnowledgePreviewDialog";
import ScheduleConfigDialog from "./ScheduleConfigDialog";
import SourceConfigDialog from "./SourceConfigDialog";

type CmsTabsProps = {
  approvedDocs: Doc[];
  pendingDocs: Doc[];
};

type UploadMode = "file" | "text";
type KnowledgeType = "pdf" | "doc" | "video" | "website" | "podcast";

export default function CmsTabs({ approvedDocs, pendingDocs }: CmsTabsProps) {
  const [pending, setPending] = useState<Doc[]>(pendingDocs);
  const [approved, setApproved] = useState<Doc[]>(approvedDocs);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);

  // Add Knowledge dialog state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Source Config dialog state
  const [sourceConfigOpen, setSourceConfigOpen] = useState(false);

  // Preview dialog state
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Delete confirmation dialog state
  const [deleteDoc, setDeleteDoc] = useState<Doc | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Scan state
  const [scanMetadata, setScanMetadata] = useState<ScanMetadata>({
    lastScanned: null,
    isScanning: false,
  });

  // Schedule Config dialog state
  const [scheduleConfigOpen, setScheduleConfigOpen] = useState(false);

  // Mock sources for demo
  const [sources] = useState<ScanSource[]>([
    {
      id: "src1",
      url: "https://example.com/blog",
      type: "website",
      enabled: true,
      lastScanned: "Oct 25, 2025, 3:00 AM",
    },
    {
      id: "src2",
      url: "https://example.com/podcast.rss",
      type: "podcast",
      enabled: true,
    },
    {
      id: "src3",
      url: "https://example.com/feed.xml",
      type: "rss",
      enabled: false,
    },
  ]);

  // Scan schedule state
  const [scanSchedule, setScanSchedule] = useState<ScanSchedule>({
    frequency: "24h",
    timeOfDay: "03:00",
    timezone: "EST",
    enabledSources: ["src1", "src2"],
  });

  const handleApprove = (doc: Doc) => {
    setPending((prev) => prev.filter((d) => d.id !== doc.id));
    setApproved((prev) => [
      ...prev,
      {
        ...doc,
        status: "Live",
        updated: new Date().toISOString().split("T")[0],
      },
    ]);
    toast.success("Approved", { description: `"${doc.title}" is now live.` });
  };

  const handleReject = (doc: Doc) => {
    setPending((prev) => prev.filter((d) => d.id !== doc.id));
    toast.error("Rejected", {
      description: `"${doc.title}" has been dismissed.`,
    });
  };

  const handleDelete = (doc: Doc) => {
    // Remove from both approved and pending (in case it's called from either)
    setApproved((prev) => prev.filter((d) => d.id !== doc.id));
    setPending((prev) => prev.filter((d) => d.id !== doc.id));
    setDeleteDialogOpen(false);
    setDeleteDoc(null);
    toast.error("Deleted", {
      description: `"${doc.title}" has been removed from the knowledge base.`,
    });
  };

  const canSubmit = useMemo(() => {
    if (!title.trim()) {
      return false;
    }
    if (uploadMode === "file") {
      return selectedFile !== null;
    }
    // For text mode
    return textContent.trim() !== "";
  }, [title, uploadMode, selectedFile, textContent]);

  function resetUploadForm() {
    setUploadMode("file");
    setSelectedFile(null);
    setTextContent("");
    setTitle("");
    setDescription("");
  }

  function handleSubmit() {
    const id = `new-${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);

    if (uploadMode === "file" && selectedFile) {
      const newDoc: Doc = {
        id,
        title: title.trim() || selectedFile.name,
        source: selectedFile.name,
        discovered: today,
        status: "Pending",
        updated: today,
      };
      setPending((prev) => [newDoc, ...prev]);
      setUploadOpen(false);
      resetUploadForm();
      toast.success("Added", {
        description: `"${newDoc.title}" submitted for approval.`,
      });
      return;
    }

    if (uploadMode === "text" && textContent.trim()) {
      const newDoc: Doc = {
        id,
        title: title.trim(),
        source: "Manual text entry",
        discovered: today,
        status: "Pending",
        updated: today,
      };
      setPending((prev) => [newDoc, ...prev]);
      setUploadOpen(false);
      resetUploadForm();
      toast.success("Added", {
        description: `"${newDoc.title}" submitted for approval.`,
      });
    }
  }

  function handleScanWeb() {
    setScanMetadata((prev) => ({ ...prev, isScanning: true }));
    toast.info("Scanning web sources...", {
      description: "This will take a few moments",
    });

    // Simulate scanning process (2-3 seconds)
    setTimeout(() => {
      const now = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      setScanMetadata({
        lastScanned: now,
        isScanning: false,
      });
      toast.success("Scan complete", {
        description: "Successfully scanned all configured sources",
      });
    }, 2500);
  }

  function formatLastScanned(timestamp: string | null) {
    if (!timestamp) {
      return "Never";
    }
    return timestamp;
  }

  function getFrequencyLabel(freq: string): string {
    switch (freq) {
      case "12h":
        return "Every 12 hours";
      case "24h":
        return "Every 24 hours";
      case "48h":
        return "Every 48 hours";
      case "weekly":
        return "Weekly";
      case "manual":
        return "Manual only";
      default:
        return "Every 24 hours";
    }
  }

  function calculateNextScan(): string {
    if (scanSchedule.frequency === "manual") {
      return "Manual scans only";
    }

    const now = new Date();
    const [hours, minutes] = (scanSchedule.timeOfDay || "03:00").split(":");
    const nextScan = new Date(now);

    nextScan.setHours(
      Number.parseInt(hours, 10),
      Number.parseInt(minutes, 10),
      0,
      0
    );

    // If the time has passed today, move to next cycle
    if (nextScan <= now) {
      switch (scanSchedule.frequency) {
        case "12h":
          nextScan.setHours(nextScan.getHours() + 12);
          break;
        case "24h":
          nextScan.setDate(nextScan.getDate() + 1);
          break;
        case "48h":
          nextScan.setDate(nextScan.getDate() + 2);
          break;
        case "weekly":
          nextScan.setDate(nextScan.getDate() + 7);
          break;
        default:
          nextScan.setDate(nextScan.getDate() + 1);
          break;
      }
    }

    const diff = nextScan.getTime() - now.getTime();
    const hoursUntil = Math.floor(diff / (1000 * 60 * 60));
    const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const timeStr = nextScan.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (hoursUntil < 1) {
      return `Next scan in ${minutesUntil} minutes (${timeStr})`;
    }
    return `Next scan in ${hoursUntil} hours (${timeStr})`;
  }

  function handleSaveSchedule(newSchedule: ScanSchedule) {
    setScanSchedule(newSchedule);
    toast.success("Schedule updated", {
      description: `Scans will run ${getFrequencyLabel(newSchedule.frequency).toLowerCase()}`,
    });
  }

  function getScanStatusIndicator() {
    if (scanMetadata.isScanning) {
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
          <span className="text-muted-foreground text-xs">Scanning active</span>
        </div>
      );
    }

    if (scanSchedule.frequency === "manual") {
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-600" />
          <span className="text-muted-foreground text-xs">Manual only</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-yellow-500" />
        <span className="text-muted-foreground text-xs">Scan scheduled</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Helper Text */}
        <div className="rounded-lg border border-muted bg-muted/30 p-4">
          <p className="text-muted-foreground text-sm">
            <strong className="text-foreground">Knowledge Base:</strong> Review
            content discovered from your sources (managed in{" "}
            <Link className="text-primary hover:underline" href="/discovery">
              Discovery
            </Link>
            ) or manually add files and text for one-time content.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <Dialog onOpenChange={setUploadOpen} open={uploadOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="default">
                  <Plus className="h-4 w-4" />
                  Add Content
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Content Manually</DialogTitle>
                  <DialogDescription>
                    Upload a file or paste text. For recurring sources, use
                    Discovery instead.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      aria-pressed={uploadMode === "file"}
                      onClick={() => setUploadMode("file")}
                      type="button"
                      variant={uploadMode === "file" ? "default" : "secondary"}
                    >
                      File
                    </Button>
                    <Button
                      aria-pressed={uploadMode === "text"}
                      onClick={() => setUploadMode("text")}
                      type="button"
                      variant={uploadMode === "text" ? "default" : "secondary"}
                    >
                      Text
                    </Button>
                  </div>

                  {uploadMode === "file" ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="file">Upload file</Label>
                        <Input
                          accept="application/pdf,.doc,.docx,video/*"
                          id="file"
                          onChange={(e) =>
                            setSelectedFile(e.target.files?.[0] ?? null)
                          }
                          type="file"
                        />
                        <p className="text-muted-foreground text-xs">
                          PDF, DOC, or Video
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="text-content">Content</Label>
                        <Textarea
                          id="text-content"
                          onChange={(e) => setTextContent(e.target.value)}
                          placeholder="Paste text content here..."
                          rows={6}
                          value={textContent}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Concise title"
                      type="text"
                      value={title}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional context"
                      value={description}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                    type="button"
                  >
                    Submit to Pending
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <Tabs className="w-full" defaultValue="approved">
        <TabsList>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="pending">
            <span className="flex items-center gap-2">
              Pending
              {pending.length > 0 && (
                <Badge className="ml-1" variant="secondary">
                  {pending.length}
                </Badge>
              )}
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    aria-label="Information about pending content"
                    className="inline-flex cursor-help"
                    type="button"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px]" side="top">
                  <p>
                    Review and approve new content before it's added to Glen
                    AI's knowledge base
                  </p>
                </TooltipContent>
              </Tooltip>
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Approved Tab */}
        <TabsContent className="mt-6" value="approved">
          {approved.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <div className="rounded-full bg-muted p-3">
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 mb-2 font-medium text-lg">
                No approved content yet
              </h3>
              <p className="mb-4 max-w-sm text-muted-foreground text-sm">
                Add your first knowledge item to get started. Upload documents
                or add links to help Glen AI learn.
              </p>
              <Button onClick={() => setUploadOpen(true)} type="button">
                Add Knowledge
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approved.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.source}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.updated}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          variant="outline"
                        >
                          Live
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => {
                            setPreviewDoc(doc);
                            setPreviewOpen(true);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          <Eye className="h-4 w-4" />
                          Preview
                        </Button>
                        <Button
                          onClick={() => setAuditDialogOpen(true)}
                          size="sm"
                          variant="ghost"
                        >
                          <History className="h-4 w-4" />
                          History
                        </Button>
                        <Button
                          onClick={() => {
                            setDeleteDoc(doc);
                            setDeleteDialogOpen(true);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent className="mt-6" value="pending">
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((doc) => (
              <Card
                className="border-border transition-colors hover:border-primary/50"
                key={doc.id}
              >
                <CardHeader>
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-muted-foreground text-sm">
                  <div>
                    Source: <span className="font-medium">{doc.source}</span>
                  </div>
                  <div>Discovered: {doc.discovered}</div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    onClick={() => {
                      setPreviewDoc(doc);
                      setPreviewOpen(true);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button onClick={() => handleApprove(doc)} size="sm">
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(doc)}
                    size="sm"
                    variant="outline"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setDeleteDoc(doc);
                      setDeleteDialogOpen(true);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}

            {pending.length === 0 && (
              <div className="col-span-2 flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
                <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-950">
                  <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="mt-4 mb-2 font-medium text-lg">
                  All caught up!
                </h3>
                <p className="max-w-sm text-muted-foreground text-sm">
                  Great! All content has been reviewed. The system will
                  automatically find new content based on your configured
                  sources.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AuditTrailDialog
        onOpenChange={setAuditDialogOpen}
        open={auditDialogOpen}
      />

      <KnowledgePreviewDialog
        doc={previewDoc}
        onOpenChange={setPreviewOpen}
        open={previewOpen}
      />

      <SourceConfigDialog
        onOpenChange={setSourceConfigOpen}
        open={sourceConfigOpen}
      />

      <ScheduleConfigDialog
        onOpenChange={setScheduleConfigOpen}
        onSave={handleSaveSchedule}
        open={scheduleConfigOpen}
        schedule={scanSchedule}
        sources={sources}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Knowledge Item</DialogTitle>
            <DialogDescription>
              Are you sure? This will remove this content from Glen AI&apos;s
              knowledge base.
            </DialogDescription>
          </DialogHeader>
          {deleteDoc && (
            <div className="rounded-lg bg-muted p-4">
              <div className="font-medium text-sm">{deleteDoc.title}</div>
              <div className="mt-1 text-muted-foreground text-xs">
                Source: {deleteDoc.source}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteDoc(null);
              }}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteDoc && handleDelete(deleteDoc)}
              variant="destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
