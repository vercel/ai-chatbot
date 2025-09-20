"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useWindowSize } from "usehooks-ts";

import type { UISuggestion } from "@/lib/editor/suggestions";
import { cn } from "@/lib/utils";
import type { ArtifactKind } from "./artifact";
import { CrossIcon, MessageIcon } from "./icons";
import { Button } from "./ui/button";

export const Suggestion = ({
  suggestion,
  onApply,
  artifactKind,
}: {
  suggestion: UISuggestion;
  onApply: () => void;
  artifactKind: ArtifactKind;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { width: windowWidth } = useWindowSize();

  return (
    <AnimatePresence>
      {isExpanded ? (
        <motion.div
          animate={{ opacity: 1, y: -20 }}
          className="-right-12 md:-right-16 absolute z-50 flex w-56 flex-col gap-3 rounded-2xl border bg-background p-3 font-sans text-sm shadow-xl"
          exit={{ opacity: 0, y: -10 }}
          initial={{ opacity: 0, y: -10 }}
          key={suggestion.id}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          whileHover={{ scale: 1.05 }}
        >
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-2">
              <div className="size-4 rounded-full bg-muted-foreground/25" />
              <div className="font-medium">Assistant</div>
            </div>
            <button
              className="cursor-pointer text-gray-500 text-xs"
              onClick={() => {
                setIsExpanded(false);
              }}
              type="button"
            >
              <CrossIcon size={12} />
            </button>
          </div>
          <div>{suggestion.description}</div>
          <Button
            className="w-fit rounded-full px-3 py-1.5"
            onClick={onApply}
            variant="outline"
          >
            Apply
          </Button>
        </motion.div>
      ) : (
        <motion.div
          className={cn("cursor-pointer p-1 text-muted-foreground", {
            "-right-8 absolute": artifactKind === "text",
            "sticky top-0 right-4": artifactKind === "code",
          })}
          onClick={() => {
            setIsExpanded(true);
          }}
          whileHover={{ scale: 1.1 }}
        >
          <MessageIcon size={windowWidth && windowWidth < 768 ? 16 : 14} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
