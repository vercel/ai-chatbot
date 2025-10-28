"use client";

import { AlertTriangle, CheckCircle, ExternalLink, History, Plus, X, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { InsightChunk } from "@/lib/mockDiscoveryData";

type InsightReviewDrawerProps = {
  chunk: InsightChunk | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (
    chunk: InsightChunk,
    editedTitle: string,
    editedMeaning: string,
    editedTags?: string[]
  ) => void;
  onDismiss: (chunk: InsightChunk, reason: string) => void;
};

export default function InsightReviewDrawer({
  chunk,
  open,
  onOpenChange,
  onApprove,
  onDismiss,
}: InsightReviewDrawerProps) {
  const [editedTitle, setEditedTitle] = useState("");
  const [editedMeaning, setEditedMeaning] = useState("");
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState("");
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // Get all unique tags from mock data
  const allAvailableTags = useMemo(() => {
    const tagSet = new Set<string>();
    // In real app, fetch from API or context
    // For now, extract from common tags in the system
    const commonTags = [
      "Career",
      "Philosophy",
      "Company",
      "Healthcare",
      "Technology",
      "Leadership",
      "CEO",
      "Board",
      "Livongo",
      "Transcarent",
      "Allscripts",
      "AI",
      "Innovation",
      "Outcomes",
      "Mission",
    ];
    commonTags.forEach(tag => tagSet.add(tag));
    return Array.from(tagSet).sort();
  }, []);

  // Update form when chunk changes
  useEffect(() => {
    if (chunk) {
      setEditedTitle(chunk.title);
      setEditedMeaning(chunk.meaning);
      setEditedTags(chunk.tags || []);
      setDismissReason("");
    }
  }, [chunk]);

  const handleApprove = () => {
    if (chunk) {
      onApprove(chunk, editedTitle, editedMeaning, editedTags);
      onOpenChange(false);
    }
  };

  const addTag = (tag: string) => {
    if (!editedTags.includes(tag)) {
      setEditedTags([...editedTags, tag]);
    }
    setNewTagInput("");
  };

  const addCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed && !editedTags.includes(trimmed)) {
      setEditedTags([...editedTags, trimmed]);
      setNewTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setEditedTags(editedTags.filter((t) => t !== tag));
  };

  const handleDismissClick = () => {
    setDismissDialogOpen(true);
  };

  const handleDismissConfirm = () => {
    if (chunk && dismissReason.trim()) {
      onDismiss(chunk, dismissReason);
      setDismissDialogOpen(false);
      onOpenChange(false);
    }
  };

  if (!chunk) {
    return null;
  }

  // Source traceability - all sources that flagged this insight
  const allSources = chunk.relationships
    .filter((r) => r.type === "flagged_from")
    .map((r) => ({
      type: chunk.sourceType,
      name: chunk.sourceName,
      domain: r.source?.domain,
      url: r.source?.url,
      at: r.at,
    }));

  // Add the primary source
  if (chunk.sourceDomain || chunk.sourceUrl || chunk.sourceName) {
    allSources.unshift({
      type: chunk.sourceType,
      name: chunk.sourceName,
      domain: chunk.sourceDomain,
      url: chunk.sourceUrl,
      at: chunk.firstSeenAt,
    });
  }

  // Audit trail - all status changes
  const auditTrail = [
    ...chunk.relationships.map((r) => ({
      action:
        r.type === "approved_by"
          ? "Approved"
          : r.type === "dismissed_by"
            ? "Dismissed"
            : "Flagged",
      actor: r.actor || "System",
      at: r.at,
      reason: r.reason,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Review Knowledge Insight</DialogTitle>
            <DialogDescription>
              Review this insight, edit if needed, then approve or dismiss
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Duplicate Warning */}
            {chunk.isDuplicate && (
              <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Potential Duplicate</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    This insight appears similar to existing knowledge. Review carefully:
                  </p>
                  <ul className="text-muted-foreground text-xs mt-2 space-y-1 list-disc list-inside">
                    <li><strong>If truly duplicate:</strong> Click "Dismiss" and note the reason</li>
                    <li><strong>If unique perspective:</strong> Edit title/meaning to distinguish, then "Approve"</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Title (Editable) */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm" htmlFor="title">
                Title
              </Label>
              <Input
                className="text-base"
                id="title"
                onChange={(e) => setEditedTitle(e.target.value)}
                value={editedTitle}
              />
              <p className="text-muted-foreground text-xs">
                Auto-extracted from source. Edit if needed.
              </p>
            </div>

            {/* Meaning (Editable) */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm" htmlFor="meaning">
                Meaning / Summary
              </Label>
              <Textarea
                className="text-base"
                id="meaning"
                onChange={(e) => setEditedMeaning(e.target.value)}
                rows={4}
                value={editedMeaning}
              />
              <p className="text-muted-foreground text-xs">
                High-level interpretation of what this insight means.
              </p>
            </div>

            {/* Tags (Editable) */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">
                Tags (helps with discovery)
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                {editedTags.map((tag, idx) => (
                  <Badge
                    className="gap-1 rounded-full pr-1"
                    key={idx}
                    variant="secondary"
                  >
                    {tag}
                    <button
                      className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTag(tag);
                      }}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Popover onOpenChange={setTagPopoverOpen} open={tagPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className="h-7 rounded-full text-xs"
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <Plus className="h-3 w-3" />
                      Add Tag
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-3">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Create New Tag</Label>
                        <div className="flex gap-2">
                          <Input
                            className="h-8 text-sm"
                            placeholder="Enter tag name..."
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomTag();
                              }
                            }}
                          />
                          <Button
                            className="h-8"
                            size="sm"
                            onClick={addCustomTag}
                            disabled={!newTagInput.trim()}
                            type="button"
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground">Common Tags</Label>
                        <div className="max-h-48 overflow-y-auto">
                          <div className="flex flex-col gap-1">
                            {allAvailableTags.filter(
                              (tag) => !editedTags.includes(tag)
                            ).map((tag) => (
                              <Button
                                className="justify-start text-sm h-8"
                                key={tag}
                                onClick={() => addTag(tag)}
                                size="sm"
                                type="button"
                                variant="ghost"
                              >
                                {tag}
                              </Button>
                            ))}
                            {allAvailableTags.every((tag) =>
                              editedTags.includes(tag)
                            ) && (
                              <p className="p-2 text-center text-muted-foreground text-xs">
                                All common tags added
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-muted-foreground text-xs">
                Add tags to make this insight easier to discover
              </p>
            </div>

            {/* Quote (Readonly) */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Supporting Quote</Label>
              <div className="rounded-lg bg-muted/30 p-4 text-base">
                "{chunk.quote}"
              </div>
              <p className="text-muted-foreground text-xs">
                Original text from source (read-only)
              </p>
            </div>

            <Separator />

            {/* Source Traceability */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-semibold text-sm">
                <History className="h-4 w-4" />
                Source History
              </Label>
              <div className="rounded-lg bg-muted/20">
                <div className="p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  Flagged {allSources.length} time
                  {allSources.length !== 1 ? "s" : ""} from:
                </div>
                <div className="divide-y divide-border/50">
                  {allSources.map((source, idx) => (
                    <div
                      className="flex items-start justify-between gap-4 p-4 text-sm"
                      key={idx}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge className="capitalize" variant="outline">
                            {source.type}
                          </Badge>
                        </div>
                        {source.name && (
                          <div className="mt-1.5 font-medium">
                            {source.name}
                          </div>
                        )}
                        <div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
                          {source.domain && <span>{source.domain}</span>}
                          {source.domain && <span>•</span>}
                          <span>{source.at}</span>
                        </div>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 flex items-center gap-1 text-primary hover:underline text-xs truncate"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="truncate">{source.url}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Audit Trail */}
            {auditTrail.length > 0 && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2 font-semibold text-sm">
                  <History className="h-4 w-4" />
                  Insight History
                </Label>
                <div className="rounded-lg bg-muted/20">
                  <div className="p-4 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                    Status Changes
                  </div>
                  <div className="divide-y divide-border/50">
                    {auditTrail.map((entry, idx) => (
                      <div
                        className="flex items-start justify-between gap-4 p-4 text-sm"
                        key={idx}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              className="text-xs"
                              variant={
                                entry.action === "Approved"
                                  ? "default"
                                  : entry.action === "Dismissed"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {entry.action}
                            </Badge>
                            <span className="text-muted-foreground">
                              by {entry.actor}
                            </span>
                          </div>
                          {entry.reason && (
                            <p className="mt-1 text-muted-foreground text-xs">
                              Reason: {entry.reason}
                            </p>
                          )}
                        </div>
                        <div className="whitespace-nowrap text-muted-foreground text-xs">
                          {entry.at}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Current Status */}
            <div className="flex items-center justify-between rounded-lg bg-muted/20 p-4">
              <div className="text-base">
                <span className="font-medium text-muted-foreground">
                  Current Status:
                </span>
              </div>
              <Badge
                className={
                  chunk.status === "pending"
                    ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                    : chunk.status === "live"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-gray-500/20 bg-gray-500/10 text-gray-700 dark:text-gray-400"
                }
                variant="outline"
              >
                {chunk.status.charAt(0).toUpperCase() + chunk.status.slice(1)}
              </Badge>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Close
            </Button>
            {chunk.status === "pending" && (
              <>
                <Button
                  onClick={handleDismissClick}
                  type="button"
                  variant="outline"
                >
                  <XCircle className="h-4 w-4" />
                  Dismiss
                </Button>
                <Button onClick={handleApprove} type="button">
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dismiss Confirmation Dialog */}
      <Dialog onOpenChange={setDismissDialogOpen} open={dismissDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dismiss Insight</DialogTitle>
            <DialogDescription>
              Please provide a reason for dismissing this insight
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="font-semibold text-sm" htmlFor="dismiss-reason">
                Reason
              </Label>
              <Textarea
                className="text-base"
                id="dismiss-reason"
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="Why is this insight being dismissed? (e.g., off-topic, low-quality, duplicate)"
                rows={3}
                value={dismissReason}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setDismissDialogOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={!dismissReason.trim()}
              onClick={handleDismissConfirm}
              type="button"
              variant="destructive"
            >
              Confirm Dismiss
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
