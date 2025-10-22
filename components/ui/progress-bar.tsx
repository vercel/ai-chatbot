"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ProgressBarProps = {
  progress: number; // 0-100
  className?: string;
};

export function ProgressBar(props: ProgressBarProps) {
  const { progress, className } = props;
  return (
    <div
      aria-valuenow={progress}
      className={cn("h-1 w-full overflow-hidden rounded bg-muted", className)}
      role="progressbar"
    >
      <motion.div
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        className="h-full rounded bg-[var(--transcarent-blue)]"
        initial={{ width: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export default ProgressBar;
