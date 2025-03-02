'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Markdown } from './markdown';
import { ExternalLinkIcon, FileTextIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export interface KnowledgeReference {
  id: string;
  title: string;
  content: string;
  score: number;
  url?: string;
}

interface KnowledgeReferencesProps {
  references: KnowledgeReference[];
}

export function KnowledgeReferences({ references }: KnowledgeReferencesProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  if (!references || references.length === 0) {
    return null;
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="flex flex-col gap-2 mt-2 text-sm">
      <div className="text-xs font-medium text-muted-foreground mb-1">
        Knowledge References ({references.length})
      </div>
      <div className="flex flex-col gap-2">
        {references.map((reference) => (
          <div
            key={reference.id}
            className="border border-border rounded-lg overflow-hidden"
          >
            <div 
              className="flex items-center justify-between p-2 bg-muted/30 cursor-pointer"
              onClick={() => toggleExpand(reference.id)}
            >
              <div className="flex items-center gap-2">
                <FileTextIcon size={14} className="text-muted-foreground" />
                <span className="font-medium truncate">{reference.title}</span>
              </div>
              <div className="flex items-center gap-2">
                {reference.url && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(reference.url, '_blank');
                        }}
                      >
                        <ExternalLinkIcon size={14} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open source</TooltipContent>
                  </Tooltip>
                )}
                <div className="text-xs text-muted-foreground">
                  {Math.round(reference.score * 100)}% match
                </div>
              </div>
            </div>
            {expanded[reference.id] && (
              <div className="p-2 border-t border-border bg-background">
                <div className="max-h-32 overflow-y-auto">
                  <Markdown>{reference.content}</Markdown>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 