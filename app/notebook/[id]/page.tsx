"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useNotebook } from '@/lib/contexts/notebook-context';
import { Notebook, MarkdownBlock, PythonBlock, CsvBlock } from '@/lib/types';
import MarkdownBlockComponent from '@/components/blocks/MarkdownBlock';
import PythonBlockComponent from '@/components/blocks/PythonBlock';
import CsvBlockComponent from '@/components/blocks/CsvBlock';

export default function NotebookPage() {
  const params = useParams<{ id: string }>();
  const { notebook, setNotebook, createBlock } = useNotebook();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchNotebook = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/notebooks/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to load notebook');
        }
        
        const data = await response.json();
        setNotebook(data.notebook);
      } catch (err) {
        console.error('Error loading notebook:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (params.id) {
      fetchNotebook();
    }
  }, [params.id, setNotebook]);
  
  const handleAddBlock = (type: 'markdown' | 'python' | 'csv') => {
    createBlock(type);
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
          <p className="mt-2">Please try again or create a new notebook.</p>
        </div>
      </div>
    );
  }
  
  if (!notebook) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>No notebook found with ID: {params.id}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{notebook.title}</h1>
        
        <div className="flex space-x-2">
          <button
            className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
            onClick={() => handleAddBlock('markdown')}
          >
            Add Markdown
          </button>
          <button
            className="px-3 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
            onClick={() => handleAddBlock('python')}
          >
            Add Python
          </button>
          <button
            className="px-3 py-2 bg-amber-100 text-amber-800 rounded-md hover:bg-amber-200"
            onClick={() => handleAddBlock('csv')}
          >
            Add CSV
          </button>
        </div>
      </div>
      
      {notebook.blocks.length === 0 ? (
        <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-md">
          <p className="text-xl">This notebook is empty.</p>
          <p className="mt-2">Add blocks using the buttons above to get started.</p>
        </div>
      ) : (
        <div>
          {notebook.blocks.map(block => {
            switch (block.type) {
              case 'markdown':
                return <MarkdownBlockComponent key={block.id} block={block as MarkdownBlock} />;
              case 'python':
                return <PythonBlockComponent key={block.id} block={block as PythonBlock} />;
              case 'csv':
                return <CsvBlockComponent key={block.id} block={block as CsvBlock} />;
              default:
                return null;
            }
          })}
        </div>
      )}
    </div>
  );
} 