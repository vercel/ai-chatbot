'use client';

import { Input } from '@/components/ui/input';
import { SearchIcon } from 'lucide-react';

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
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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
  );
}