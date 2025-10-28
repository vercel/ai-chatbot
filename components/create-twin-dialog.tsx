"use client";
import { Sparkles } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import type { Twin } from "@/lib/types";

type CreateTwinDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (twin: Twin) => void;
};

export default function CreateTwinDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateTwinDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primarySource, setPrimarySource] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    const newTwin: Twin = {
      id: crypto.randomUUID(),
      name: name.trim(),
      status: "draft",
      description: description.trim() || undefined,
      createdAt: new Date().toISOString().split("T")[0],
      primarySource: primarySource || undefined,
      trainingStatus: "not_started",
      capabilities: {
        text: true,
        voice: false,
        avatar: false,
      },
      knowledgeSources: [],
    };

    onCreate(newTwin);

    toast.success("Created!", {
      description: `${name} is now in draft mode. Configure sources to activate.`,
      duration: 4000,
    });

    setName("");
    setDescription("");
    setPrimarySource("");
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create New Glen AI
          </DialogTitle>
          <DialogDescription>
            Create a new Glen AI instance with purpose-built knowledge and governance
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="twin-name">Name *</Label>
            <Input
              autoFocus
              id="twin-name"
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Glen AI"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="twin-description">Persona & Purpose</Label>
            <Textarea
              id="twin-description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe Glen AI's voice, priorities, and key focus areas..."
              rows={4}
              value={description}
            />
            <p className="text-muted-foreground text-xs">
              Define tone, strategic themes, and communication style
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary-source">Primary Knowledge Source</Label>
            <Select onValueChange={setPrimarySource} value={primarySource}>
              <SelectTrigger id="primary-source">
                <SelectValue placeholder="Select initial source type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="documents">Internal Documents</SelectItem>
                <SelectItem value="interviews">
                  Interview Transcripts
                </SelectItem>
                <SelectItem value="social">Social Media & Articles</SelectItem>
                <SelectItem value="video">Video Content</SelectItem>
                <SelectItem value="mixed">Mixed Sources</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              You can add more sources after creation
            </p>
          </div>

          <div className="space-y-2 rounded-lg bg-muted p-4">
            <div className="font-medium text-sm">Default Access</div>
            <div className="text-muted-foreground text-sm">
              New instances are created in{" "}
              <span className="font-medium">draft mode</span> with Editor-only
              access. Configure sources and permissions before activating.
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button type="submit">
              <Sparkles />
              Create Glen AI
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
