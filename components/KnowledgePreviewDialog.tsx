"use client";

import {
  Calendar,
  ExternalLink,
  FileText,
  Globe,
  Podcast,
  User,
  Video,
} from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Doc } from "@/lib/types";

type KnowledgePreviewDialogProps = {
  doc: Doc | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function KnowledgePreviewDialog({
  doc,
  open,
  onOpenChange,
}: KnowledgePreviewDialogProps) {
  const getContentTypeIcon = () => {
    if (!doc) {
      return <FileText className="h-5 w-5" />;
    }
    switch (doc.contentType) {
      case "pdf":
      case "doc":
        return <FileText className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "website":
        return <Globe className="h-5 w-5" />;
      case "podcast":
        return <Podcast className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getContentTypeLabel = () => {
    if (!doc) {
      return "Document";
    }
    switch (doc.contentType) {
      case "pdf":
        return "PDF Document";
      case "doc":
        return "Document";
      case "video":
        return "Video";
      case "website":
        return "Website";
      case "podcast":
        return "Podcast";
      default:
        return "Document";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return "N/A";
    }
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        {doc ? (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="mt-1 text-primary">{getContentTypeIcon()}</div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl leading-tight">
                    {doc.title}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    Preview knowledge item details and source information
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Content Type Badge */}
                <div>
                  <Badge className="gap-1.5" variant="secondary">
                    {getContentTypeIcon()}
                    <span>{getContentTypeLabel()}</span>
                  </Badge>
                </div>

                {/* Thumbnail Preview for Video/Website */}
                {doc?.thumbnailUrl &&
                  (doc.contentType === "video" ||
                    doc.contentType === "website") && (
                    <div className="overflow-hidden rounded-lg border border-border">
                      <div className="relative h-auto w-full">
                        <Image
                          alt={`Preview of ${doc.title}`}
                          className="h-auto w-full object-cover"
                          height={400}
                          src={doc.thumbnailUrl}
                          width={800}
                        />
                      </div>
                    </div>
                  )}

                {/* Description */}
                {doc.description && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-muted-foreground text-sm">
                      Description
                    </h4>
                    <p className="text-sm leading-relaxed">{doc.description}</p>
                  </div>
                )}

                <Separator />

                {/* Source Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Source Information</h4>

                  <div className="grid gap-3 text-sm">
                    {/* Source */}
                    <div className="flex items-start gap-3">
                      <div className="w-28 shrink-0 text-muted-foreground">
                        Source
                      </div>
                      <div className="font-medium">{doc.source}</div>
                    </div>

                    {/* URL with link */}
                    {doc.url && (
                      <div className="flex items-start gap-3">
                        <div className="w-28 shrink-0 text-muted-foreground">
                          Original Link
                        </div>
                        <a
                          className="flex items-center gap-1.5 break-all text-primary hover:underline"
                          href={doc.url}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          <span className="break-all">{doc.url}</span>
                          <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        </a>
                      </div>
                    )}

                    {/* Author */}
                    {doc.author && (
                      <div className="flex items-start gap-3">
                        <div className="flex w-28 shrink-0 items-center gap-1.5 text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          Author
                        </div>
                        <div>{doc.author}</div>
                      </div>
                    )}

                    {/* Published Date */}
                    {doc.publishedDate && (
                      <div className="flex items-start gap-3">
                        <div className="flex w-28 shrink-0 items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          Published
                        </div>
                        <div>{formatDate(doc.publishedDate)}</div>
                      </div>
                    )}

                    {/* Duration (for video/podcast) */}
                    {doc.duration && (
                      <div className="flex items-start gap-3">
                        <div className="w-28 shrink-0 text-muted-foreground">
                          Duration
                        </div>
                        <div>{doc.duration}</div>
                      </div>
                    )}

                    {/* File Size */}
                    {doc.fileSize && (
                      <div className="flex items-start gap-3">
                        <div className="w-28 shrink-0 text-muted-foreground">
                          File Size
                        </div>
                        <div>{doc.fileSize}</div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Metadata */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Metadata</h4>

                  <div className="grid gap-3 text-sm">
                    {/* Status */}
                    <div className="flex items-start gap-3">
                      <div className="w-28 shrink-0 text-muted-foreground">
                        Status
                      </div>
                      <div>
                        <Badge
                          className={
                            doc.status === "Live"
                              ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                              : "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                          }
                          variant="default"
                        >
                          {doc.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Discovered Date */}
                    {doc.discovered && (
                      <div className="flex items-start gap-3">
                        <div className="w-28 shrink-0 text-muted-foreground">
                          Discovered
                        </div>
                        <div>{formatDate(doc.discovered)}</div>
                      </div>
                    )}

                    {/* Last Updated */}
                    {doc.updated && (
                      <div className="flex items-start gap-3">
                        <div className="w-28 shrink-0 text-muted-foreground">
                          Last Updated
                        </div>
                        <div>{formatDate(doc.updated)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                {doc.url && (
                  <div className="pt-2">
                    <Button
                      asChild
                      className="w-full"
                      type="button"
                      variant="outline"
                    >
                      <a
                        href={doc.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <ExternalLink />
                        View Original Source
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            No document selected
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
