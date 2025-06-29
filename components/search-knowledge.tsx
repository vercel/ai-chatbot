'use client';

import { memo } from 'react';
import { FileIcon, GlobeIcon, InfoIcon } from './icons';

interface SearchResult {
  rank: number;
  content: string;
  source: string;
  sourceType: string;
  similarity: number;
}

interface SearchKnowledgeResult {
  resultType: 'knowledgeBaseResults';
  results: SearchResult[];
  message?: string;
  error?: string;
}

interface SearchKnowledgeProps {
  result: SearchKnowledgeResult;
}

function PureSearchKnowledge({ result }: SearchKnowledgeProps) {
  const { results, message, error } = result;

  // Handle error state
  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 rounded-xl p-4">
        <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-medium mb-2">
          <InfoIcon size={16} />
          Knowledge Base Search Error
        </div>
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  // Handle empty results
  if (results.length === 0) {
    return (
      <div className="border border-muted rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground font-medium mb-2">
          <InfoIcon size={16} />
          Knowledge Base Search
        </div>
        <p className="text-muted-foreground text-sm">
          {message || 'No relevant information found in the knowledge base.'}
        </p>
      </div>
    );
  }

  // Get unique sources
  const uniqueSources = Array.from(
    new Map(results.map(result => [result.source, result])).values()
  );

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType?.toLowerCase()) {
      case 'file':
      case 'document':
        return <FileIcon size={14} />;
      case 'url':
      case 'web':
        return <GlobeIcon size={14} />;
      default:
        return <InfoIcon size={14} />;
    }
  };

  const getDocumentName = (source: string) => {
    // Extract just the filename from the path
    const parts = source.split('/');
    return parts[parts.length - 1] || source;
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-muted-foreground">
        Sources
      </div>
      
      <div className="space-y-2">
        {uniqueSources.map((result, index) => (
          <div key={index} className="flex items-center gap-2">
            {getSourceIcon(result.sourceType)}
            {result.sourceType?.toLowerCase() === 'url' && result.source.endsWith('.md') ? (
              <a 
                href={result.source.replace(/\.md$/, '')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {result.source.replace(/\.md$/, '')}
              </a>
            ) : (
              <span className="text-sm font-medium">
                {getDocumentName(result.source)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const SearchKnowledge = memo(PureSearchKnowledge); 