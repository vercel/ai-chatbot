"use client";

import { useState, useEffect } from 'react';
import { MarkdownBlock as MarkdownBlockType } from '@/lib/types';
import { useNotebook } from '@/lib/contexts/notebook-context';
import BlockWrapper from '@/components/ui/BlockWrapper';
import BlockControls from '@/components/ui/BlockControls';

interface MarkdownBlockProps {
  block: MarkdownBlockType;
}

export default function MarkdownBlock({ block }: MarkdownBlockProps) {
  const { updateBlock } = useNotebook();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/files/${block.filePath}`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
        } else {
          setContent('');
        }
      } catch (error) {
        console.error('Failed to load markdown content:', error);
        setContent('');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContent();
  }, [block.filePath]);
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  
  const handleBlur = async () => {
    // Save content to file
    try {
      await fetch('/api/files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: block.filePath,
          content
        })
      });
      
      // Update block
      updateBlock(block.id, {
        updated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save markdown content:', error);
    }
  };
  
  const toggleEditMode = () => {
    updateBlock(block.id, {
      type: 'markdown',
      editMode: !block.editMode
    });
  };
  
  return (
    <BlockWrapper block={block}>
      <div className="flex justify-end mb-2">
        <button
          className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200"
          onClick={toggleEditMode}
        >
          {block.editMode ? 'Preview' : 'Edit'}
        </button>
        <BlockControls block={block} />
      </div>
      
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      ) : block.editMode ? (
        <textarea
          value={content}
          onChange={handleContentChange}
          onBlur={handleBlur}
          className="w-full min-h-[200px] p-2 border rounded-md"
          placeholder="Enter markdown content..."
        />
      ) : (
        <div className="prose max-w-full">
          <div dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />
        </div>
      )}
    </BlockWrapper>
  );
}

// Simple markdown parser for display
function parseMarkdown(text: string): string {
  // This is a very basic implementation - in a real app, use a proper markdown library
  return text
    // Headers
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    // Bold and italic
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
    // Lists
    .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
    .replace(/^- (.*$)/gim, '<ul><li>$1</li></ul>')
    // Paragraphs
    .replace(/\n/gim, '<br>');
} 