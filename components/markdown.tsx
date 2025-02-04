import React from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

const components: Partial<Components> = {
  // Remove code block related components
};

export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
      className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0"
    >
      {children}
    </ReactMarkdown>
  );
}
