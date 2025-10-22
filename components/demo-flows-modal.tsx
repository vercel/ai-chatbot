"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { DemoFlow } from "@/config/demoScript";
import { demoFlows } from "@/config/demoScript";
import { useEffect } from "react";

type DemoFlowsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFlowSelect: (flow: DemoFlow) => void;
};

export function DemoFlowsModal({
  open,
  onOpenChange,
  onFlowSelect,
}: DemoFlowsModalProps) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onOpenChange]);

  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Demo Flows</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2">
          {demoFlows.map((flow) => (
            <Button
              className="h-auto flex-col items-start justify-start p-4 text-left"
              key={flow.id}
              onClick={() => {
                onFlowSelect(flow);
                onOpenChange(false);
              }}
              variant="outline"
            >
              <div className="font-semibold">{flow.title}</div>
              <div className="text-muted-foreground text-xs">
                {flow.description}
              </div>
            </Button>
          ))}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
