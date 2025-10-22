"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const KEY = "platform-banner-dismissed";

export function PlatformBanner() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "1") {
        setOpen(false);
      }
    } catch {
      // no-op
    }
  }, []);

  useEffect(() => {
    try {
      if (!open) {
        localStorage.setItem(KEY, "1");
      }
    } catch {
      // no-op
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-t-md border bg-muted/80 px-3 py-2 text-muted-foreground text-xs backdrop-blur supports-[backdrop-filter]:bg-muted/60">
        <span>Prototype experience — illustrative only</span>
        <Button
          aria-label="Dismiss banner"
          onClick={() => setOpen(false)}
          size="sm"
          type="button"
          variant="ghost"
        >
          ✕
        </Button>
      </div>
    </div>
  );
}

export default PlatformBanner;
