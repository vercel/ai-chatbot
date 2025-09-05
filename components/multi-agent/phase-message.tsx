'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AgentPhase, phaseDetails, phaseStyles } from './phase';

interface PhaseMessageProps {
  phase: AgentPhase;
  children: ReactNode;
  isLoading?: boolean;
}

export function PhaseMessage({
  phase,
  children,
  isLoading,
}: PhaseMessageProps) {
  const { label, icon: Icon } = phaseDetails[phase];
  const style = phaseStyles[phase];

  return (
    <div className="flex items-start gap-2 py-2">
      <div
        className={cn(
          'flex items-center justify-center rounded-full border p-1 size-6',
          style,
        )}
      >
        <Icon size={14} />
      </div>
      <div className="flex-1">
        <span className="text-xs font-semibold">{label}</span>
        <div className="mt-1 rounded-md bg-muted p-2 text-sm">
          {children}
          {isLoading && (
            <motion.span
              className="ml-2 inline-block animate-pulse"
              aria-label="loading"
            >
              ...
            </motion.span>
          )}
        </div>
      </div>
    </div>
  );
}
