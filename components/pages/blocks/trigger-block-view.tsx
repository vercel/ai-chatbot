"use client";

import { useState } from "react";
import type { TriggerBlockDraft } from "../types";
import { Button } from "@/components/ui/button";
import { useTriggerBlockAction } from "../hooks";

export type TriggerBlockViewProps = {
  block: TriggerBlockDraft;
};

export function TriggerBlockView({ block }: TriggerBlockViewProps) {
  const [confirmed, setConfirmed] = useState(false);
  const { execute, status, error } = useTriggerBlockAction(block);

  const handleClick = () => {
    if (block.display.requireConfirmation && !confirmed) {
      setConfirmed(true);
      return;
    }
    setConfirmed(false);
    void execute();
  };

  return (
    <div className="flex flex-1 flex-col gap-3 p-4">
      <p className="text-sm text-muted-foreground">
        Trigger hook:{" "}
        <span className="font-mono text-foreground">
          {block.display.hookName || "—"}
        </span>
      </p>
      <Button
        type="button"
        variant={
          block.display.actionType === "primary"
            ? "default"
            : block.display.actionType === "destructive"
              ? "destructive"
              : "outline"
        }
        onClick={handleClick}
      >
        {block.display.buttonText || "Run action"}
      </Button>
      {block.display.requireConfirmation ? (
        <p className="text-xs text-muted-foreground">
          {confirmed
            ? block.display.confirmationText
            : "Requires confirmation before running."}
        </p>
      ) : null}
      {status === "pending" ? (
        <p className="text-xs text-muted-foreground">Executing…</p>
      ) : null}
      {status === "success" ? (
        <p className="text-xs text-emerald-600">Trigger executed.</p>
      ) : null}
      {status === "error" && error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : null}
    </div>
  );
}

