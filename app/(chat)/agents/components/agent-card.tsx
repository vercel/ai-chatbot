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
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BotIcon className="size-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg line-clamp-1">
                  {agent.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>
                    Created {new Date(agent.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <Button size="sm" variant="secondary" asChild>
              <Link href={`/agents/${agent.slug}`}>
                View
              </Link>
            </Button>
          </div>

          {/* Description */}
          {agent.description && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {agent.description}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <UsersIcon className="size-3" />
                <span>{agent.isPublic ? 'Public' : 'Private'}</span>
              </div>
              {agent.modelId && (
                <div className="px-2 py-0.5 bg-secondary rounded text-xs">
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