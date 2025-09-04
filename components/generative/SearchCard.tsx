'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Search, ExternalLink } from 'lucide-react';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

interface SearchData {
  query: string;
  results: SearchResult[];
}

interface SearchCardProps {
  data: SearchData;
}

export function SearchCard({ data }: SearchCardProps) {
  return (
    <Card className="p-4 w-full max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Resultados para: "{data.query}"</h3>
      </div>
      
      <div className="space-y-3">
        {data.results.map((result, index) => (
          <div key={index} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
            <a 
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-primary group-hover:underline">
                  {result.title}
                </h4>
                <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {result.snippet}
              </p>
              <p className="text-xs text-blue-600 mt-2">{result.url}</p>
            </a>
          </div>
        ))}
      </div>
    </Card>
  );
}