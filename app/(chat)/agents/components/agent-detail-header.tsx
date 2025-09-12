'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BotIcon, UsersIcon, ArrowLeftIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generateUUID } from '@/lib/utils';

interface AgentDetailHeaderProps {
  agent: {
    id: string;
    name: string;
    description: string | null;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
    agentPrompt: string | null;
    modelId: string | null;
    isPublic: boolean;
  };
}

export function AgentDetailHeader({ agent }: AgentDetailHeaderProps) {
  const router = useRouter();
  
  const handleStartChat = () => {
    const chatId = generateUUID();
    router.push(`/chat/${chatId}?agent=${agent.slug}`);
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-12 py-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="sm" asChild className="shrink-0">
            <Link href="/agents" className="flex items-center gap-2">
              <ArrowLeftIcon className="size-4" />
              Back to Agents
            </Link>
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BotIcon className="size-8 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="text-3xl font-bold mb-2">{agent.name}</h1>
                    {agent.description && (
                      <p className="text-muted-foreground text-lg mb-4">
                        {agent.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <UsersIcon className="size-4" />
                        <span>{agent.isPublic ? 'Public Agent' : 'Private Agent'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Created {new Date(agent.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Updated {new Date(agent.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {agent.modelId && (
                      <Badge variant="secondary">{agent.modelId}</Badge>
                    )}
                    <Button variant="outline" size="sm">
                      <StarIcon className="size-4 mr-2" />
                      Save
                    </Button>
                    <Button size="sm" onClick={handleStartChat}>
                      Start Chat
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}