'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BotIcon, UsersIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
import type { Agent } from '@/lib/db/schema';

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: (agent: Agent) => void;
}

export function AgentCard({
  agent,
  isSelected,
  isSelectionMode,
  onSelect,
}: AgentCardProps) {
  return (
    <Card
      className={`hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-border/80 ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : ''
      } ${isSelectionMode ? ' bg-blue-50/30 shadow-md' : ''}`}
      onClick={() => onSelect(agent)}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                <BotIcon className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg line-clamp-1 break-words">
                  {agent.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>
                    {new Date(agent.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>
            <Button size="sm" variant="secondary" asChild className="shrink-0">
              <Link href={`/agents/${agent.slug}`}>
                View
              </Link>
            </Button>
          </div>

          {/* Description */}
          {agent.description && (
            <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {agent.description}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <UsersIcon className="size-3" />
                <span>{agent.isPublic ? 'Public' : 'Private'}</span>
              </div>
              {agent.modelId && (
                <div className="px-2 py-0.5 bg-secondary rounded text-xs font-medium">
                  {agent.modelId}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <StarIcon className="size-3" />
              <span>0</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}