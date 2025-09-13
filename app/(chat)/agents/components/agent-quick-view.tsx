'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { PencilIcon, TrashIcon, CopyIcon } from 'lucide-react';
import type { Agent } from '@/lib/db/schema';
import { AgentPromptPreview } from './agent-prompt-preview';
import { generateUUID } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AgentQuickViewProps {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

export function AgentQuickView({ agent, open, onOpenChange, currentUserId }: AgentQuickViewProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = agent && currentUserId && agent.userId === currentUserId;

  const copyToClipboard = async () => {
    if (!agent?.agentPrompt) return;
    try {
      await navigator.clipboard.writeText(agent.agentPrompt);
      toast.success('Agent prompt copied to clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy prompt');
    }
  };

  const startChat = () => {
    if (!agent) return;
    const chatId = generateUUID();
    router.push(`/chat/${chatId}?agent=${agent.slug}`);
  };

  const handleEdit = () => {
    if (!agent) return;
    // TODO: Open edit modal or navigate to edit page
    router.push(`/agents/edit/${agent.slug}`);
  };

  const handleDelete = async () => {
    if (!agent) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/agents/${agent.slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }

      toast.success('Agent deleted successfully');
      setShowDeleteDialog(false);
      onOpenChange(false);
      
      // Refresh the page to update the agent list
      router.refresh();
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {agent && (
            <>
              <DialogHeader>
                <DialogTitle className="break-words">{agent.name}</DialogTitle>
                {agent.description && (
                  <DialogDescription>{agent.description}</DialogDescription>
                )}
              </DialogHeader>

              {agent.agentPrompt && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Agent Prompt
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyToClipboard}
                      className="flex items-center gap-2"
                    >
                      <CopyIcon className="size-4" />
                      Copy
                    </Button>
                  </div>
                  <AgentPromptPreview agentPrompt={agent.agentPrompt} />
                </div>
              )}

              <DialogFooter>
                <div className="flex items-center gap-2 w-full">
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        className="flex items-center gap-2"
                      >
                        <PencilIcon className="size-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        className="flex items-center gap-2 text-destructive hover:text-destructive"
                      >
                        <TrashIcon className="size-4" />
                        Delete
                      </Button>
                    </div>
                  )}
                  <Button onClick={startChat} className="ml-auto">
                    Start Chat
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{agent?.name}"? This action cannot be undone and will remove the agent permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Agent'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


