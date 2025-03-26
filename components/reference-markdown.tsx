'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { KnowledgeReference } from './knowledge-references';
import { useReferencesSidebar } from '@/hooks/use-references-sidebar';

interface ReferenceMarkdownProps {
  children: string;
  className?: string;
  references?: KnowledgeReference[];
}

export function ReferenceMarkdown({ children, className, references = [] }: ReferenceMarkdownProps) {
  const { setActiveReference } = useReferencesSidebar();

  // Custom renderer component for matching citation patterns like [1], [2], etc.
  // Custom text component to properly handle all text nodes with citation patterns
  const TextWithCitations = ({ children }: { children: React.ReactNode }) => {
    // Convert children to string to work with
    const value = children?.toString() || '';
    
    // If there are no citations, just return the text
    if (!value.includes('[') || !references.length) {
      return <>{value}</>;
    }
    // Match citation patterns [number]
    const citationRegex = /\[(\d+)\]/g;
    
    // Split the string by citation patterns, keeping the citations
    const parts = [];
    let lastIndex = 0;
    let match;
    const textContent = value.toString();
    
    while ((match = citationRegex.exec(textContent)) !== null) {
      // Text before the citation
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: textContent.substring(lastIndex, match.index),
        });
      }
      
      // The citation itself
      const citationNumber = parseInt(match[1], 10);
      // Zero-based array index but 1-based citation number
      const referenceIndex = citationNumber - 1;
      
      parts.push({
        type: 'citation',
        content: match[0],
        index: referenceIndex,
        hasReference: references.length > referenceIndex && referenceIndex >= 0,
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Text after the last citation
    if (lastIndex < textContent.length) {
      parts.push({
        type: 'text',
        content: textContent.substring(lastIndex),
      });
    }
    
    // Render the parsed parts
    return (
      <>
        {parts.map((part, index) => {
          if (part.type === 'citation' && part.hasReference) {
            return (
              <button
                key={index}
                className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium rounded bg-secondary/15 hover:bg-secondary/25 text-secondary-foreground cursor-pointer focus:ring-2 focus:ring-secondary/30 focus:outline-none transition-colors"
                onClick={() => {
                  const reference = references[part.index];
                  if (reference) {
                    console.log('Citation clicked:', part.content, 'Reference:', reference.id);
                    setActiveReference(reference.id);
                  } else {
                    console.log('No reference found for citation:', part.content);
                  }
                }}
                aria-label={`View reference ${part.content}`}
              >
                {part.content}
              </button>
            );
          }
          return <span key={index}>{part.content}</span>;
        })}
      </>
    );
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn('prose dark:prose-invert max-w-none', className)}
      components={{
        // Override the default text components to handle citations
        text: TextWithCitations,
        // We no longer need custom handlers for each element type
        // since we're handling all text nodes directly
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
