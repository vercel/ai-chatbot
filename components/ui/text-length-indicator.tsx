"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TextLengthIndicatorProps = {
  length: number;
  optimalRange?: { min: number; good: number; max?: number };
  className?: string;
};

const DEFAULT_OPTIMAL = {
  min: 50,
  good: 150,
  max: 2000,
};

export function TextLengthIndicator({
  length,
  optimalRange = DEFAULT_OPTIMAL,
  className,
}: TextLengthIndicatorProps) {
  const { min, good, max = Infinity } = optimalRange;
  const [shouldShow, setShouldShow] = useState(false);
  const [hasTyped, setHasTyped] = useState(false);

  // Track if user has typed anything
  useEffect(() => {
    if (length > 0) {
      setHasTyped(true);
      // Show indicator after user stops typing (debounced)
      const timeout = setTimeout(() => {
        setShouldShow(true);
      }, 800);

      return () => clearTimeout(timeout);
    } else {
      // Hide if field is empty
      setShouldShow(false);
      setHasTyped(false);
    }
  }, [length]);

  // Don't show anything if user hasn't typed or just cleared the field
  if (!shouldShow || !hasTyped) {
    return null;
  }

  let message: string;
  let colorClass: string;

  if (length < min) {
    message = `Consider adding more detail (${min - length} more characters recommended for better AI context)`;
    colorClass = "text-muted-foreground";
  } else if (length < good) {
    message = `More detail would be helpful (${good - length} more characters for optimal context)`;
    colorClass = "text-muted-foreground";
  } else if (length <= max) {
    message = "Great detail level";
    colorClass = "text-muted-foreground";
  } else {
    message = `You've provided plenty of detail (${length} characters)`;
    colorClass = "text-muted-foreground";
  }

  return (
    <div className={cn("text-xs", colorClass, className)}>
      {message}
    </div>
  );
}

