"use client";

import { useState, useEffect } from 'react';
import { PythonBlock as PythonBlockType } from '@/lib/types';
import { useNotebook } from '@/lib/contexts/notebook-context';
import BlockWrapper from '@/components/ui/BlockWrapper';
import BlockControls from '@/components/ui/BlockControls';
import { CodeEditor } from '@/components/code-editor';

interface PythonBlockProps {
  block: PythonBlockType;
}

// Simple wrapper around CodeEditor to adapt to our interface
const SimpleCodeEditor = ({ code, onChange, language }: { code: string; onChange: (value: string) => void; language: string }) => {
  return (
    <CodeEditor
      content={code}
      onSaveContent={(content) => onChange(content)}
      status="idle"
      isCurrentVersion={true}
      currentVersionIndex={0}
      suggestions={[]}
    />
  );
};

export default function PythonBlock({ block }: PythonBlockProps) {
  const { updateBlock } = useNotebook();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  
  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/files/${block.filePath}`);
        if (response.ok) {
          const data = await response.json();
          setCode(data.content);
        } else {
          setCode('');
        }
      } catch (error) {
        console.error('Failed to load Python code:', error);
        setCode('');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadContent();
  }, [block.filePath]);
  
  const handleContentChange = (value: string) => {
    setCode(value);
  };
  
  const handleSave = async () => {
    // Save content to file
    try {
      await fetch('/api/files', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: block.filePath,
          content: code
        })
      });
      
      // Update block
      updateBlock(block.id, {
        updated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save Python code:', error);
    }
  };
  
  const executeCode = async () => {
    setIsExecuting(true);
    updateBlock(block.id, {
      type: 'python',
      isExecuting: true
    });
    
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          filePath: block.filePath
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        updateBlock(block.id, {
          type: 'python',
          output: result.output,
          isExecuting: false
        });
      } else {
        const error = await response.text();
        updateBlock(block.id, {
          type: 'python',
          output: `Error: ${error}`,
          isExecuting: false
        });
      }
    } catch (error) {
      console.error('Failed to execute code:', error);
      updateBlock(block.id, {
        type: 'python',
        output: `Error: ${error instanceof Error ? error.message : String(error)}`,
        isExecuting: false
      });
    } finally {
      setIsExecuting(false);
    }
  };
  
  return (
    <BlockWrapper block={block}>
      <div className="flex justify-end mb-2 space-x-2">
        <button
          className="px-3 py-1 rounded-md text-sm bg-green-100 hover:bg-green-200 text-green-700"
          onClick={executeCode}
          disabled={isExecuting || isLoading}
        >
          {isExecuting ? 'Executing...' : 'Run'}
        </button>
        <button
          className="px-3 py-1 rounded-md text-sm bg-gray-100 hover:bg-gray-200"
          onClick={handleSave}
          disabled={isLoading}
        >
          Save
        </button>
        <BlockControls block={block} />
      </div>
      
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border rounded-md overflow-hidden">
            <SimpleCodeEditor code={code} onChange={handleContentChange} language="python" />
          </div>
          
          {block.output && (
            <div className="bg-gray-100 p-3 rounded-md">
              <h4 className="text-sm font-semibold mb-2">Output:</h4>
              <pre className="text-sm whitespace-pre-wrap overflow-x-auto">{block.output}</pre>
            </div>
          )}
        </div>
      )}
    </BlockWrapper>
  );
} 