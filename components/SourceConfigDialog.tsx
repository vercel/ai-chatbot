"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ScanSource } from "@/lib/types";

type SourceConfigDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const INITIAL_SOURCES: ScanSource[] = [
  {
    id: "1",
    url: "https://example.com/blog/rss",
    type: "rss",
    enabled: true,
  },
  {
    id: "2",
    url: "https://example.com/podcast",
    type: "podcast",
    enabled: true,
  },
  {
    id: "3",
    url: "https://example.com/articles",
    type: "website",
    enabled: false,
  },
];

export default function SourceConfigDialog({
  open,
  onOpenChange,
}: SourceConfigDialogProps) {
  const [sources, setSources] = useState<ScanSource[]>(INITIAL_SOURCES);
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<ScanSource["type"]>("website");

  const handleAddSource = () => {
    if (!newUrl.trim()) {
      return;
    }

    try {
      new URL(newUrl);
      const newSource: ScanSource = {
        id: Date.now().toString(),
        url: newUrl.trim(),
        type: newType,
        enabled: true,
      };
      setSources((prev) => [...prev, newSource]);
      setNewUrl("");
      toast.success("Source added", {
        description: `Added ${newType} source to scan list`,
      });
    } catch {
      toast.error("Invalid URL", {
        description: "Please enter a valid URL",
      });
    }
  };

  const handleRemoveSource = (id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
    toast.success("Source removed");
  };

  const handleToggleSource = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Configure Scan Sources</DialogTitle>
          <DialogDescription>
            Manage the sources that will be scanned for new knowledge content.
            This is a prototype feature.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-mono text-sm">
                      {source.url}
                    </TableCell>
                    <TableCell className="capitalize">{source.type}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleToggleSource(source.id)}
                        size="sm"
                        type="button"
                        variant={source.enabled ? "default" : "outline"}
                      >
                        {source.enabled ? "Enabled" : "Disabled"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleRemoveSource(source.id)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
            <Label>Add New Source</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com/feed"
                  type="url"
                  value={newUrl}
                />
              </div>
              <Select
                onValueChange={(value) =>
                  setNewType(value as ScanSource["type"])
                }
                value={newType}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                  <SelectItem value="rss">RSS Feed</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddSource} type="button">
                <Plus />
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
