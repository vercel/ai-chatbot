'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BotIcon, ArrowLeftIcon, GlobeIcon, LockIcon } from 'lucide-react';
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
      <div className="container mx-auto px-4 md:px-12 py-6">
        <div className="space-y-6">
          {/* Back button */}
          <Button variant="ghost" size="sm" asChild className="w-fit">
            <Link href="/agents" className="flex items-center gap-2">
              <ArrowLeftIcon className="size-4" />
              <span className="hidden sm:inline">Back to Agents</span>
              <span className="sm:hidden">Back</span>
            </Link>
          </Button>

          {/* Main content */}
          <div className="flex flex-col lg:flex-row gap-8 lg:items-center lg:justify-between">
            {/* Agent info */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className="p-3 bg-primary/10 rounded-lg shrink-0">
                <BotIcon className="size-8 text-primary" />
              </div>
              
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2 break-words">{agent.name}</h1>
                  {agent.description && (
                    <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                      {agent.description}
                    </p>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={agent.isPublic ? "secondary" : "outline"} className="flex items-center gap-1">
                    {agent.isPublic ? <GlobeIcon className="size-3" /> : <LockIcon className="size-3" />}
                    {agent.isPublic ? 'Public' : 'Private'}
                  </Badge>
                  
                  {agent.modelId && (
                    <Badge variant="outline">{agent.modelId}</Badge>
                  )}
                  
                  <span className="text-sm text-muted-foreground">
                    Created {new Date(agent.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Primary action */}
            <div className="shrink-0">
              <Button
                size="lg"
                onClick={handleStartChat}
                className="w-full lg:w-auto px-8"
              >
                Start Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}