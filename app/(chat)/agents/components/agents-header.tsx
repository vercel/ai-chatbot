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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap font-medium">
          {totalAgents} agent{totalAgents !== 1 ? 's' : ''} available
        </span>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button asChild className="w-full sm:w-auto">
          <Link href="/agents/new" className="flex items-center gap-2">
            <PlusIcon className="size-4" />
            <span className="hidden sm:inline">Create Agent</span>
            <span className="sm:hidden">Create</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}