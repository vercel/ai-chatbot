'use client';

import { cn } from '@/lib/utils';
import { GlobeIcon } from './icons';

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  error?: string;
}

export function SearchResults({ results, query, error }: SearchResultsProps) {
  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-xl bg-red-50 dark:bg-red-950/20 dark:border-red-900">
        <p className="text-sm text-red-600 dark:text-red-400">
          Error searching for "{query}": {error}
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50 dark:bg-zinc-950/20 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No results found for "{query}"
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border border-zinc-200 rounded-xl bg-zinc-50 dark:bg-zinc-950/20 dark:border-zinc-800">
      <h3 className="text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
        Search results for "{query}"
      </h3>
      <div className="space-y-3">
        {results.map((result) => (
          <div key={result.url} className="space-y-1">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {result.title}
              <GlobeIcon size={12} />
            </a>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {result.description}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate">
              {result.url}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
