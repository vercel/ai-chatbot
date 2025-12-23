"use client";

import {
  CheckCircle2,
  ChevronRight,
  Circle,
  Edit,
  GitBranch,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export interface ConversationBranch {
  id: string;
  parentId: string | null;
  messageIndex: number;
  title: string;
  description?: string;
  createdAt: Date;
  messages: any[]; // ChatMessage type
  isActive: boolean;
}

interface ConversationBranchingProps {
  chatId: string;
  currentBranchId: string;
  branches: ConversationBranch[];
  onCreateBranch?: (
    parentId: string | null,
    fromMessageIndex: number,
    title: string
  ) => void;
  onSwitchBranch?: (branchId: string) => void;
  onDeleteBranch?: (branchId: string) => void;
  onRenameBranch?: (branchId: string, newTitle: string) => void;
}

export function ConversationBranching({
  chatId,
  currentBranchId,
  branches,
  onCreateBranch,
  onSwitchBranch,
  onDeleteBranch,
  onRenameBranch,
}: ConversationBranchingProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchTitle, setNewBranchTitle] = useState("");
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const currentBranch = branches.find((b) => b.id === currentBranchId);

  // Build branch tree structure
  const buildBranchTree = () => {
    const rootBranches = branches.filter((b) => b.parentId === null);
    const branchMap = new Map<string, ConversationBranch[]>();

    branches.forEach((branch) => {
      if (branch.parentId) {
        if (!branchMap.has(branch.parentId)) {
          branchMap.set(branch.parentId, []);
        }
        branchMap.get(branch.parentId)!.push(branch);
      }
    });

    return { rootBranches, branchMap };
  };

  const { rootBranches, branchMap } = buildBranchTree();

  const handleCreateBranch = () => {
    if (newBranchTitle.trim() && currentBranch) {
      onCreateBranch?.(
        currentBranchId,
        currentBranch.messages.length,
        newBranchTitle.trim()
      );
      setNewBranchTitle("");
      setIsCreating(false);
    }
  };

  const handleRenameBranch = (branchId: string) => {
    if (editTitle.trim()) {
      onRenameBranch?.(branchId, editTitle.trim());
      setEditingBranchId(null);
      setEditTitle("");
    }
  };

  const renderBranch = (branch: ConversationBranch, depth = 0) => {
    const isActive = branch.id === currentBranchId;
    const children = branchMap.get(branch.id) || [];
    const hasChildren = children.length > 0;

    return (
      <div key={branch.id}>
        <div
          className={`flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-accent ${
            isActive ? "bg-accent" : ""
          }`}
          onClick={() => !isActive && onSwitchBranch?.(branch.id)}
          style={{ marginLeft: `${depth * 20}px` }}
        >
          {hasChildren ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Circle className="ml-0.5 h-3 w-3 text-muted-foreground" />
          )}

          {isActive ? (
            <CheckCircle2 className="h-4 w-4 text-primary" />
          ) : (
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          )}

          <div className="min-w-0 flex-1">
            {editingBranchId === branch.id ? (
              <Input
                autoFocus
                className="h-7 text-sm"
                onBlur={() => handleRenameBranch(branch.id)}
                onChange={(e) => setEditTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameBranch(branch.id);
                  if (e.key === "Escape") {
                    setEditingBranchId(null);
                    setEditTitle("");
                  }
                }}
                value={editTitle}
              />
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span
                    className={`truncate font-medium text-sm ${isActive ? "text-primary" : ""}`}
                  >
                    {branch.title}
                  </span>
                  {isActive && (
                    <Badge className="h-5 px-1.5 text-xs" variant="secondary">
                      Active
                    </Badge>
                  )}
                </div>
                {branch.description && (
                  <p className="truncate text-muted-foreground text-xs">
                    {branch.description}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <Button
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setEditingBranchId(branch.id);
                setEditTitle(branch.title);
              }}
              size="icon"
              variant="ghost"
            >
              <Edit className="h-3 w-3" />
            </Button>
            {branch.parentId && (
              <Button
                className="h-6 w-6 text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBranch?.(branch.id);
                }}
                size="icon"
                variant="ghost"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span>{branch.messages.length} msgs</span>
          </div>
        </div>

        {hasChildren && (
          <div className="mt-1">
            {children.map((child) => renderBranch(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            <CardTitle className="text-base">Conversation Branches</CardTitle>
          </div>
          <Dialog onOpenChange={setIsCreating} open={isCreating}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1 h-4 w-4" />
                New Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Branch</DialogTitle>
                <DialogDescription>
                  Fork the current conversation to explore different paths
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="font-medium text-sm" htmlFor="branch-title">
                    Branch Title
                  </label>
                  <Input
                    id="branch-title"
                    onChange={(e) => setNewBranchTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateBranch();
                    }}
                    placeholder="e.g., Alternative Approach"
                    value={newBranchTitle}
                  />
                </div>
                <div className="text-muted-foreground text-sm">
                  <p>
                    Branching from: <strong>{currentBranch?.title}</strong>
                  </p>
                  <p>
                    At message:{" "}
                    <strong>{currentBranch?.messages.length || 0}</strong>
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsCreating(false)} variant="outline">
                  Cancel
                </Button>
                <Button
                  disabled={!newBranchTitle.trim()}
                  onClick={handleCreateBranch}
                >
                  Create Branch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription className="text-xs">
          Explore different conversation paths
        </CardDescription>
      </CardHeader>
      <Separator />
      <ScrollArea className="flex-1">
        <div className="group space-y-1 p-4">
          {rootBranches.map((branch) => renderBranch(branch, 0))}
        </div>
      </ScrollArea>

      {/* Branch Info */}
      {currentBranch && (
        <>
          <Separator />
          <div className="bg-muted/50 p-3">
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current Branch:</span>
                <span className="font-medium">{currentBranch.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Messages:</span>
                <span className="font-medium">
                  {currentBranch.messages.length}
                </span>
              </div>
              {currentBranch.parentId && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Branched From:</span>
                  <span className="font-medium">
                    {branches.find((b) => b.id === currentBranch.parentId)
                      ?.title || "Unknown"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
