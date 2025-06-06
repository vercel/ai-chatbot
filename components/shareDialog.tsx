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
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl p-6 sm:max-w-md w-full space-y-6 shadow-xl border border-gray-700 bg-black">
        <DialogTitle className="text-2xl font-semibold flex items-center gap-2 text-white">
          <LinkIcon className="w-5 h-5 text-gray-400" />
          Share this chat
        </DialogTitle>
        {summary && (
          <DialogDescription className="text-sm text-gray-300">
            {summary}
          </DialogDescription>
        )}

        <div className="flex items-center gap-3 border border-gray-700 rounded-lg px-4 py-2 bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500 transition">
          <input
            className="flex-1 bg-transparent outline-none text-sm text-white"
            readOnly
            value={shareUrl}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="gap-1 bg-gray-800 text-white hover:bg-gray-700"
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
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-gray-300 hover:bg-gray-800"
          >
            Close
          </Button>
        </AlertDialogFooter>
      </DialogContent>
    </Dialog>
  );
}
