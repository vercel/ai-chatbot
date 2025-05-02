'use client';

import { Shield, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatJSON } from '../lib/utils';

interface ToolPermissionDialogProps {
  open: boolean;
  onOpenChangeAction: (open: boolean) => void;
  toolName: string;
  description: string;
  args?: any;
  onAllowAction: () => void;
  onDenyAction: () => void;
}

export function ToolPermissionDialog({
  open,
  onOpenChangeAction,
  toolName,
  description,
  args,
  onAllowAction,
  onDenyAction,
}: ToolPermissionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChangeAction}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            Permission Request
          </DialogTitle>
          <DialogDescription>
            The tool <span className="font-mono font-medium">{toolName}</span>{' '}
            is requesting permission to access certain features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <h4 className="text-sm font-medium mb-1">Description</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-1">Request</h4>
            <pre className="text-xs font-mono whitespace-pre-wrap break-all overflow-y-auto max-h-30 scrollbar-thin">
              {formatJSON(args)}
            </pre>
          </div>

          <div className="rounded-md bg-muted p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Important</p>
                <p className="text-muted-foreground">
                  Review each action carefully before approving. We cannot
                  guarantee the security or privacy practices of third-party
                  integrations.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onDenyAction}>
              Deny
            </Button>
            <Button size="sm" onClick={onAllowAction}>
              Allow
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
