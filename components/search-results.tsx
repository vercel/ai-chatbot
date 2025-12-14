"use client";

import { GlobeIcon } from "lucide-react";
import type { SearchSource } from "@/lib/types";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";


export function SearchResults({ searchResult }: { searchResult: SearchSource[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!searchResult || !Array.isArray(searchResult) || searchResult.length === 0) {
    return null;
  }

  return (
    <Collapsible
      className="not-prose w-full"
      onOpenChange={setIsOpen}
      open={isOpen}
    >
      <CollapsibleTrigger className="flex w-full min-w-0 items-center gap-2 text-muted-foreground text-xs transition-colors hover:text-foreground">
        <GlobeIcon className="size-4 shrink-0" />
        <span className="font-medium">
          Searched web
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-muted-foreground">
            {searchResult.length} {searchResult.length === 1 ? "result" : "results"}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-3 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-hidden data-[state=closed]:animate-out data-[state=open]:animate-in">
        <div className="grid gap-1.5">
          {searchResult.map((source, index) => (
            <Link
              className="flex items-center gap-2 text-xs transition-colors hover:text-foreground min-w-0 overflow-hidden animate-in fade-in-0 slide-in-from-top-1"
              href={source.url}
              key={index}
              rel="noopener noreferrer"
              target="_blank"
            >
              <div className="flex size-4 shrink-0 items-center justify-center overflow-hidden rounded">
                {source.favicon ? (
                  <img
                    alt=""
                    className="size-4"
                    src={source.favicon}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <GlobeIcon className="size-3 text-muted-foreground" />
                )}
              </div>
              <span className="truncate font-medium text-foreground">
                {source.title}
              </span>
              <span className="shrink-0 truncate text-muted-foreground max-w-[120px]">
                {new URL(source.url).hostname.replace('www.', '')}
              </span>
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SearchingIndicator() {
  return (
    <div className="flex w-full items-center gap-2 text-muted-foreground text-xs animate-in fade-in-0">
      <GlobeIcon className="size-4 shrink-0 animate-pulse" />
      <span>Searching the web</span>
    </div>
  );
}
