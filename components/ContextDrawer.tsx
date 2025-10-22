"use client";

import { Info, Plus, Trash2, Pin } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useMemory } from "@/lib/contexts/MemoryContext";

type ContextDrawerProps = {
  about: string;
};

export default function ContextDrawer({ about }: ContextDrawerProps) {
  const { memories, addMemory, deleteMemory, togglePin } = useMemory();
  const [newMemoryText, setNewMemoryText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddMemory = () => {
    if (newMemoryText.trim()) {
      addMemory(newMemoryText.trim(), 'topic');
      setNewMemoryText("");
      setIsAdding(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'preference': return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 'decision': return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 'followup': return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
      default: return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Sort: pinned first, then by timestamp
  const sortedMemories = [...memories].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <Info className="mr-2 h-4 w-4" />
          Context
          {memories.length > 0 && (
            <Badge className="ml-2" variant="secondary">
              {memories.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[420px]" side="right">
        <SheetHeader>
          <SheetTitle>Context & Memory</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* About section - always visible at top */}
          <div>
            <h3 className="mb-3 font-medium text-sm">About Glen AI</h3>
            <p className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">
              {about}
            </p>
          </div>

          {/* Memory section - scrollable below context */}
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
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                  onChange={(e) => setNewMemoryText(e.target.value)}
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
                <p className="text-center text-muted-foreground text-sm py-4">
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
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            className={`${getCategoryColor(item.category)} text-xs`}
                            variant="secondary"
                          >
                            {item.category}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {formatRelativeTime(item.timestamp)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          className="h-6 w-6"
                          onClick={() => togglePin(item.id)}
                          size="icon"
                          variant="ghost"
                        >
                          <Pin
                            className={`h-3 w-3 ${item.pinned ? 'fill-current' : ''}`}
                          />
                        </Button>
                        <Button
                          className="h-6 w-6"
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
