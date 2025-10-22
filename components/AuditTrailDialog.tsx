"use client";

import { CheckCircle, Edit, XCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AUDIT_TRAIL } from "@/lib/mockData";

type AuditTrailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AuditTrailDialog({
  open,
  onOpenChange,
}: AuditTrailDialogProps) {
  const getIcon = (action: string) => {
    if (action === "Approved") {
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    }
    if (action === "Rejected") {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <Edit className="h-4 w-4 text-blue-500" />;
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Audit Trail</DialogTitle>
          <DialogDescription>
            History of actions taken on content items
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {AUDIT_TRAIL.map((item) => (
              <div
                className="flex gap-4 border-border border-b pb-4 last:border-0"
                key={item.id}
              >
                <div className="mt-1">{getIcon(item.action)}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{item.action}</span>
                    <span className="text-muted-foreground text-xs">
                      {item.timestamp}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    <span className="font-medium">{item.actor}</span>{" "}
                    {item.action.toLowerCase()} "{item.target}"
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
