'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BotIcon, UsersIcon, } from 'lucide-react';
import type { Agent, User } from '@/lib/db/schema';

interface AgentCardProps {
  agent: Agent;
  user: User | null;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: () => void;
}

export function AgentCard({
  agent,
  user,
  isSelected,
  isSelectionMode,
  onSelect,
}: AgentCardProps) {
  const authorName = user?.email;

  return (
    <Card
      className={`hover:shadow-md transition-all duration-200 cursor-pointer border hover:border-border/80 ${
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' : ''
      } ${isSelectionMode ? ' bg-blue-50/30 shadow-md' : ''}`}
      onClick={onSelect}
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
                <div className="text-xs text-muted-foreground mt-1">
                  Created {new Date(agent.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {agent.description && (
            <div className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {agent.description}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <UsersIcon className="size-3" />
                <span>{agent.isPublic ? 'Public' : 'Private'}</span>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              Created by: <b>{authorName}</b>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}