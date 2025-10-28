"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PinChip } from "./pin-chip";

type PrioritiesCardProps = {
  priorities: string[];
  onClose: () => void;
  show: boolean;
  pinned?: boolean;
  onPinChange?: (pinned: boolean) => void;
  isLoading?: boolean;
};

export function PrioritiesCard({
  priorities,
  onClose,
  show,
  pinned: externalPinned,
  onPinChange,
  isLoading,
}: PrioritiesCardProps) {
  const [internalPinned, setInternalPinned] = useState(false);
  const pinned = externalPinned ?? internalPinned;

  const handleTogglePin = () => {
    const newPinned = !pinned;
    if (onPinChange) {
      onPinChange(newPinned);
    } else {
      setInternalPinned(newPinned);
    }
  };

  // Reset pinned state when priorities change
  useEffect(() => {
    if (priorities.length > 0) {
      if (onPinChange) {
        onPinChange(false);
      } else {
        setInternalPinned(false);
      }
    }
  }, [priorities, onPinChange]);

  return (
    <AnimatePresence>
      {(show || isLoading) && (
        <motion.div
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="-translate-x-1/2 fixed bottom-24 left-1/2 z-30 w-full max-w-lg px-4"
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <div className="rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Glen's Priorities</h3>
              <div className="flex items-center gap-2">
                <PinChip onToggle={handleTogglePin} pinned={pinned} />
                {!pinned && (
                  <Button onClick={onClose} size="icon" variant="ghost">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1, 0.8],
                      }}
                      className="size-1.5 rounded-full bg-primary"
                      key={i}
                      transition={{
                        duration: 1.2,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: i * 0.2,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
                <span className="italic">Updating priorities...</span>
              </div>
            ) : (
              <ul className="space-y-2">
                {priorities.map((priority) => (
                  <motion.li
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2 text-muted-foreground text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    key={priority}
                    transition={{ delay: 0.1 }}
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    {priority}
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
