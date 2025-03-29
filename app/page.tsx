"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { generateUUID } from '@/lib/utils';

interface NotebookListItem {
  id: string;
  title: string;
  updatedAt: string;
  blockCount: number;
}

export default function HomePage() {
  const [notebooks, setNotebooks] = useState<NotebookListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchNotebooks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/notebooks');
        if (!response.ok) {
          throw new Error('Failed to load notebooks');
        }
        
        const data = await response.json();
        setNotebooks(data.notebooks);
      } catch (err) {
        console.error('Error loading notebooks:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotebooks();
  }, []);
  
  const handleCreateNotebook = async () => {
    try {
      const notebookId = generateUUID();
      const newNotebook = {
        id: notebookId,
        title: 'Untitled Notebook',
        blocks: [],
        files: []
      };
      
      const response = await fetch('/api/notebooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notebook: newNotebook })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create notebook');
      }
      
      const result = await response.json();
      
      // Redirect to the new notebook
      window.location.href = `/notebook/${result.id}`;
    } catch (err) {
      console.error('Error creating notebook:', err);
      setError(err instanceof Error ? err.message : 'Failed to create notebook');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notebooks</h1>
        
        <button
          onClick={handleCreateNotebook}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          New Notebook
        </button>
      </div>
      
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 p-6 rounded-md">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error}</p>
        </div>
      ) : notebooks.length === 0 ? (
        <div className="text-center py-16 text-gray-500 border-2 border-dashed rounded-md">
          <p className="text-xl">No notebooks found</p>
          <p className="mt-2">Create your first notebook to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notebooks.map((notebook) => (
            <Link 
              key={notebook.id} 
              href={`/notebook/${notebook.id}`}
              className="block bg-white border rounded-md p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{notebook.title}</h2>
              <div className="flex justify-between text-sm text-gray-500">
                <span>
                  {notebook.blockCount} block{notebook.blockCount !== 1 ? 's' : ''}
                </span>
                <span>
                  {new Date(notebook.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 