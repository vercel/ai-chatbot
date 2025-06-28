'use client';

import { memo } from 'react';
import { Card } from './ui/card';
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

  const getSourceTypeLabel = (sourceType: string) => {
    switch (sourceType?.toLowerCase()) {
      case 'file':
        return 'File';
      case 'document':
        return 'Document';
      case 'url':
      case 'web':
        return 'URL';
      default:
        return 'Knowledge Base';
    }
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  const formatSimilarity = (similarity: number) => {
    return `${Math.round(similarity * 100)}%`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <InfoIcon size={16} />
        Found {results.length} relevant {results.length === 1 ? 'result' : 'results'} in knowledge base
      </div>
      
      <div className="space-y-3">
        {results.map((result) => (
          <Card key={result.rank} className="p-4 bg-muted/30">
            <div className="space-y-3">
              {/* Header with source info and similarity */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getSourceIcon(result.sourceType)}
                  <span className="text-sm font-medium text-muted-foreground">
                    {getSourceTypeLabel(result.sourceType)}
                  </span>
                  <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">
                    Rank #{result.rank}
                  </span>
                </div>
                <span className="px-2 py-1 bg-background border border-border rounded-full text-xs">
                  {formatSimilarity(result.similarity)} match
                </span>
              </div>

              {/* Content preview */}
              <div className="space-y-2">
                <p className="text-sm leading-relaxed">
                  {truncateContent(result.content)}
                </p>
                
                {/* Source information */}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground truncate" title={result.source}>
                    <span className="font-medium">Source:</span> {result.source}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const SearchKnowledge = memo(PureSearchKnowledge); 