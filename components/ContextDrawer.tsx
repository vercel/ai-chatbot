"use client";

import { Info, Pin, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMemory } from "@/lib/contexts/MemoryContext";

export default function ContextDrawer() {
  const { memories, addMemory, deleteMemory, togglePin } = useMemory();
  const [newMemoryText, setNewMemoryText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMemory = () => {
    if (newMemoryText.trim()) {
      addMemory(newMemoryText.trim(), "chat");
      setNewMemoryText("");
      setIsAdding(false);
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "user":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
      case "chat":
        return "bg-green-500/10 text-green-700 dark:text-green-300";
      case "avatar":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300";
      case "call":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-300";
      default:
        return "bg-muted text-foreground";
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) {
      return "just now";
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return date.toLocaleDateString();
  };

  // Sort: pinned first, then by timestamp
  const sortedMemories = [...memories].sort((a, b) => {
    if (a.pinned && !b.pinned) {
      return -1;
    }
    if (!a.pinned && b.pinned) {
      return 1;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <Info className="h-4 w-4" />
          Memory
          {memories.length > 0 && (
            <Badge className="ml-1" variant="secondary">
              {memories.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[420px]" side="right">
        <SheetHeader>
          <SheetTitle>Memory</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Memory tracks important information from your conversations.
            Memories are added automatically or you can add them manually.
          </p>

          {/* Memory section */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-sm">Memory</h3>
              <Button
                onClick={() => setIsAdding(!isAdding)}
                size="sm"
                variant="ghost"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {isAdding && (
              <div className="mb-3 flex gap-2">
                <Input
                  className="text-sm"
                  onChange={(e) => setNewMemoryText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddMemory()}
                  placeholder="Add a memory..."
                  value={newMemoryText}
                />
                <Button onClick={handleAddMemory} size="sm">
                  Add
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {sortedMemories.length === 0 ? (
                <p className="py-4 text-center text-muted-foreground text-sm">
                  No memories yet. Add one above!
                </p>
              ) : (
                sortedMemories.map((item) => (
                  <div
                    className="group relative rounded-lg bg-muted px-3 py-2 text-sm"
                    key={item.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-foreground">{item.content}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <Badge
                            className={`text-xs ${getSourceColor(item.source)}`}
                            variant="secondary"
                          >
                            {item.source}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {formatRelativeTime(item.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          onClick={() => togglePin(item.id)}
                          size="icon"
                          variant="ghost"
                        >
                          <Pin
                            className={`h-3 w-3 ${item.pinned ? "fill-current" : ""}`}
                          />
                        </Button>
                        <Button
                          onClick={() => deleteMemory(item.id)}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
