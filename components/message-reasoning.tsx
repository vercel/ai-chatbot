'use client';

import { type ReactNode, useState } from 'react';
import { ChevronDownIcon, LoaderIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Markdown } from './markdown';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
  children?: ReactNode;
}

export function MessageReasoning({
  isLoading,
  reasoning,
  children,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '1rem',
      marginBottom: '0.5rem',
    },
  };

  // Convert children to array and count them for timeline
  const childrenArray = Array.isArray(children)
    ? children
    : children
      ? [children]
      : [];
  const hasChildren = childrenArray.length > 0;

  // Create a unified timeline array with reasoning and tools
  const timelineItems: Array<{
    type: 'reasoning' | 'tool';
    content: ReactNode;
  }> = [];

  // Add reasoning as first item if it exists
  if (reasoning && reasoning.trim().length > 0) {
    timelineItems.push({
      type: 'reasoning',
      content: (
        <div className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed pt-8">
          <Markdown>{reasoning}</Markdown>
        </div>
      ),
    });
  }

  // Add tools as subsequent items
  childrenArray.forEach((child) => {
    timelineItems.push({
      type: 'tool',
      content: child,
    });
  });

  // Always render the timeline (even if reasoning is empty) so dots and layout remain consistent

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoning</div>
          <div className="animate-spin">
            <LoaderIcon size={14} />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoned for a few seconds</div>
          <button
            data-testid="message-reasoning-toggle"
            type="button"
            className="cursor-pointer"
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronDownIcon size={14} />
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="relative"
          >
            {/* Timeline container */}
            <div className="relative pl-6">
              {/* Timeline line */}
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-zinc-300 dark:bg-zinc-600" />

              {/* Unified timeline items */}
              <div className="space-y-2">
                {timelineItems.map((item, index) => (
                  <div
                    key={`timeline-item-${item.type}-${index}`}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute -left-4 top-3 rounded-full border-2 border-white dark:border-gray-900 z-10 ${
                        item.type === 'reasoning'
                          ? 'size-2.5 bg-zinc-400 dark:bg-zinc-500'
                          : 'size-2.5 bg-zinc-400 dark:bg-zinc-500'
                      }`}
                    />
                    {/* White background line to hide timeline behind dot */}
                    <div
                      className={`absolute -left-4 bg-white dark:bg-gray-900 ${
                        item.type === 'reasoning' ? 'w-3 h-8' : 'w-2.5 h-8'
                      }`}
                    />

                    {/* Content */}
                    <div
                      className={`text-sm ${item.type === 'tool' ? 'pl-2' : ''}`}
                    >
                      {item.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
