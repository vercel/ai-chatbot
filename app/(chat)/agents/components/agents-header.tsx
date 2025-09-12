'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusIcon, SearchIcon } from 'lucide-react';
import Link from 'next/link';

interface AgentsHeaderProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  totalAgents: number;
}

export function AgentsHeader({
  searchTerm,
  onSearchTermChange,
  totalAgents,
}: AgentsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
        <div className="relative max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {totalAgents} agent{totalAgents !== 1 ? 's' : ''} available
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button asChild>
          <Link href="/agents/new" className="flex items-center gap-2">
            <PlusIcon className="size-4" />
            Create Agent
          </Link>
        </Button>
      </div>
    </div>
  );
}