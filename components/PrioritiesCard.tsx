'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PinChip } from './pin-chip';
import { useState, useEffect } from 'react';

interface PrioritiesCardProps {
  priorities: string[];
  onClose: () => void;
  show: boolean;
  pinned?: boolean;
  onPinChange?: (pinned: boolean) => void;
  isLoading?: boolean;
}

export function PrioritiesCard({ priorities, onClose, show, pinned: externalPinned, onPinChange, isLoading }: PrioritiesCardProps) {
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
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed left-1/2 bottom-24 -translate-x-1/2 w-full max-w-lg px-4 z-30"
        >
          <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-sm text-card-foreground">Glen's Priorities</h3>
              <div className="flex items-center gap-2">
                <PinChip
                  pinned={pinned}
                  onToggle={handleTogglePin}
                />
                {!pinned && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="size-1.5 rounded-full bg-primary"
                      animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.8, 1, 0.8],
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
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
                {priorities.map((priority, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-muted-foreground text-sm"
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
