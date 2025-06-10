'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@radix-ui/react-dialog';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertDialogFooter } from './ui/alert-dialog';
import { CheckIcon, CopyIcon, LinkIcon } from 'lucide-react';
import { Button } from './ui/button';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatId: string;
  visibilityType: 'private' | 'organisation';
  summary?: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  chatId,
  visibilityType,
  summary,
}: ShareDialogProps) {
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/chat/${chatId}`
      : '';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] rounded-2xl p-6 sm:max-w-md w-full space-y-6 shadow-xl border border-sidebar-border bg-sidebar text-sidebar-foreground z-50">
        <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-sidebar-foreground/70" />
          Share this chat
        </DialogTitle>
        {summary && (
          <DialogDescription className="text-sm text-sidebar-foreground/70">
            {summary}
          </DialogDescription>
        )}

        <div className="flex items-center gap-3 border border-sidebar-border rounded-lg px-4 py-2 bg-sidebar-accent focus-within:ring-2 focus-within:ring-sidebar-ring transition">
          <input
            className="flex-1 bg-transparent outline-none text-sm"
            readOnly
            value={shareUrl}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="gap-1 bg-sidebar-accent text-sidebar-foreground hover:bg-sidebar-accent/80"
          >
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4" />
                Copied
              </>
            ) : (
              <>
                <CopyIcon className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>

        <AlertDialogFooter>
          <Button
            variant="default"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-black text-white hover:bg-black/90"
          >
            Close
          </Button>
        </AlertDialogFooter>
      </DialogContent>
    </Dialog>
  );
}
