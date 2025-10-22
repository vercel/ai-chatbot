"use client";

import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ContextDrawerProps = {
  memory: string[];
  about: string;
};

export default function ContextDrawer({ memory, about }: ContextDrawerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <Info className="mr-2 h-4 w-4" />
          Context
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[420px]" side="right">
        <SheetHeader>
          <SheetTitle>Context</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Memory section */}
          <div>
            <h3 className="mb-3 font-medium text-sm">Memory</h3>
            <div className="space-y-2">
              {memory.map((item) => (
                <div
                  className="rounded-lg bg-muted px-3 py-2 text-muted-foreground text-sm"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* About section */}
          <div>
            <h3 className="mb-3 font-medium text-sm">About Glen AI</h3>
            <p className="whitespace-pre-line text-muted-foreground text-sm leading-relaxed">
              {about}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
