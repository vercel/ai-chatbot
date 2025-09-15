'use client';

import { Button } from '@/components/ui/button';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useState } from 'react';

interface AgentPromptPreviewProps {
  agentPrompt: string;
}

export function AgentPromptPreview({ agentPrompt }: AgentPromptPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const charLimit = 400;
  const isLong = agentPrompt.length > charLimit;
  const displayText =
    !isExpanded && isLong
      ? `${agentPrompt.slice(0, charLimit)}...`
      : agentPrompt;

  return (
    <div className="relative bg-muted/50 rounded-lg p-4 pb-8 border">
      <pre className="font-mono text-sm whitespace-pre-wrap text-foreground leading-relaxed">
        {displayText}
      </pre>
      {!isExpanded && isLong && (
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-background via-background/95 to-transparent rounded-b-lg pointer-events-none" />
      )}
      {isLong && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute bottom-2 left-2 flex items-center gap-2"
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="size-4" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDownIcon className="size-4" />
              Show More
            </>
          )}
        </Button>
      )}
    </div>
  );
}
