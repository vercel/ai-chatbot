"use client";

import { useState } from "react";

export function BrowserViewport() {
  const [status] = useState<"idle" | "running" | "done">("idle");

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-semibold">AI Browser</h2>
        <span className="text-xs text-muted-foreground">
          Status: {status === "idle" ? "Idle" : status === "running" ? "Running…" : "Done"}
        </span>
      </div>
      <div className="flex-1 bg-muted/30">
        {/* TODO: Replace this placeholder with a live Browserbase iframe or Stagehand visualization */}
        <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
          Browser automation preview will appear here.
          <br />
          (Later: embed Browserbase iframe / real-time DOM preview.)
        </div>
      </div>
    </div>
  );
}
