## Timeline Reasoning View (legacy)

This document preserves the previous timeline-style reasoning UI that was replaced by the new `Reasoning` elements in `components/elements/reasoning.tsx`.

Use this if you want to bring back an animated timeline with dots and a collapsible section that shows the model's reasoning followed by tool outputs.

### What it looked like

- Collapsible/expandable section with a header that shows a spinner while reasoning is streaming and a summary once finished
- Animated open/close using framer-motion
- Vertical timeline line and dots for each entry
- First item: the model reasoning
- Following items: any tool render output passed as `children`

### Integration notes

1) Create a component file (for example `components/message-reasoning-timeline.tsx`) and paste the implementation below.
2) In `components/message.tsx`, where we handle a reasoning part, render `MessageReasoningTimeline` instead of the current `MessageReasoning`.
3) Pass tool content as `children` to appear after reasoning in the timeline.

If you previously used the now-removed `Markdown` component, you can swap it with the `Response` element to render rich text consistently with the rest of the app.

### Dependencies

- `framer-motion` for animation
- Icons (either local `components/icons.tsx` or `lucide-react`)

### Component implementation (drop-in)

```tsx
'use client';

import { type ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Option A (local icons):
// import { ChevronDownIcon, LoaderIcon } from '@/components/icons';
// Option B (lucide):
import { ChevronDown, Loader2 } from 'lucide-react';
import { Response } from '@/components/elements/response';

interface MessageReasoningTimelineProps {
  isLoading: boolean;
  reasoning: string;
  children?: ReactNode;
}

export function MessageReasoningTimeline({
  isLoading,
  reasoning,
  children,
}: MessageReasoningTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const variants = {
    collapsed: { height: 0, opacity: 0, marginTop: 0, marginBottom: 0 },
    expanded: { height: 'auto', opacity: 1, marginTop: '1rem', marginBottom: '0.5rem' },
  } as const;

  const childrenArray = Array.isArray(children) ? children : children ? [children] : [];

  const timelineItems: Array<{ type: 'reasoning' | 'tool'; content: ReactNode }> = [];

  if (reasoning && reasoning.trim().length > 0) {
    timelineItems.push({
      type: 'reasoning',
      content: (
        <div className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed pt-8">
          {/* If you prefer, swap <Response> for your own Markdown renderer. */}
          <Response>{reasoning}</Response>
        </div>
      ),
    });
  }

  for (const child of childrenArray) {
    timelineItems.push({ type: 'tool', content: child });
  }

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoning</div>
          <div className="animate-spin">
            {/* Swap for <LoaderIcon /> if using local icons */}
            <Loader2 className="size-3.5" />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-sm">Reasoned for a few seconds</div>
          <button
            data-testid="message-reasoning-toggle"
            type="button"
            className="cursor-pointer"
            onClick={() => setIsExpanded((v) => !v)}
          >
            {/* Swap for <ChevronDownIcon /> if using local icons */}
            <ChevronDown className="size-3.5" />
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

              {/* Timeline items */}
              <div className="space-y-2">
                {timelineItems.map((item, index) => (
                  <div key={`timeline-item-${item.type}-${index}`} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-4 top-3 size-2.5 rounded-full bg-zinc-400 dark:bg-zinc-500 border-2 border-white dark:border-gray-900 z-10" />
                    {/* White strip to mask line under the dot */}
                    <div className="absolute -left-4 w-3 h-8 bg-white dark:bg-gray-900" />

                    {/* Content */}
                    <div className={item.type === 'tool' ? 'text-sm pl-2' : 'text-sm'}>
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
```

### Example usage in `components/message.tsx`

```tsx
// inside the part rendering loop when encountering a reasoning part
return (
  <MessageReasoningTimeline isLoading={isLoading} reasoning={part.text}>
    {/* Render tool children here if you want them in the timeline */}
    {Array.isArray((part as any)._toolChildren)
      ? (part as any)._toolChildren.map((c: any, childIndex: number) => renderToolChild(c, childIndex))
      : null}
  </MessageReasoningTimeline>
);
```

That’s it. You can tweak the spacing, colors, and animation timings to match your current design system.


