'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

import { UISuggestion } from '@/lib/editor/suggestions';

import { CrossIcon, MessageIcon } from './icons';
import useWindowSize from './use-window-size';
import { Button } from '../ui/button';

export const Suggestion = ({
  suggestion,
  onApply,
}: {
  suggestion: UISuggestion;
  onApply: () => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { width: windowWidth } = useWindowSize();

  return !isExpanded ? (
    <div
      className="absolute cursor-pointer text-muted-foreground -right-8 p-1"
      onClick={() => {
        setIsExpanded(true);
      }}
    >
      <MessageIcon size={windowWidth && windowWidth < 768 ? 16 : 14} />
    </div>
  ) : (
    <motion.div
      className="absolute bg-background p-3 flex flex-col gap-3 rounded-2xl border text-sm w-56 shadow-xl z-50 -right-12 md:-right-20"
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-2">
          <div className="size-4 bg-muted-foreground/25 rounded-full" />
          <div className="font-medium">Assistant</div>
        </div>
        <div
          className="text-xs text-gray-500 cursor-pointer"
          onClick={() => {
            setIsExpanded(false);
          }}
        >
          <CrossIcon size={12} />
        </div>
      </div>
      <div>{suggestion.description}</div>
      <Button
        variant="outline"
        className="w-fit py-1.5 px-3 rounded-full"
        onClick={onApply}
      >
        Apply
      </Button>
    </motion.div>
  );
};
