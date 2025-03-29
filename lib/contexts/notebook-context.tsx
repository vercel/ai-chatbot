"use client";
import { createContext, useContext, useState, ReactNode } from 'react';
import { Notebook, MarkdownBlock, PythonBlock, CsvBlock } from '@/lib/types';
import { generateUUID } from '@/lib/utils';

interface NotebookContextType {
  notebook: Notebook | null;
  setNotebook: (notebook: Notebook) => void;
  selectedBlockId: string | null;
  selectBlock: (id: string | null) => void;
  updateBlock: (id: string, updates: Partial<MarkdownBlock | PythonBlock | CsvBlock>) => void;
  createBlock: (type: 'markdown' | 'python' | 'csv', position?: number) => Promise<string>;
  deleteBlock: (id: string) => Promise<void>;
  moveBlockUp: (id: string) => Promise<void>;
  moveBlockDown: (id: string) => Promise<void>;
}

const NotebookContext = createContext<NotebookContextType | undefined>(undefined);

export function NotebookProvider({ children }: { children: ReactNode }) {
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  
  const selectBlock = (id: string | null) => {
    setSelectedBlockId(id);
  };
  
  const updateBlock = (id: string, updates: Partial<MarkdownBlock | PythonBlock | CsvBlock>) => {
    if (!notebook) return;
    
    const updatedBlocks = notebook.blocks.map(block => {
      if (block.id !== id) return block;
      
      // Always preserve the original type
      if (block.type === 'markdown') {
        return { ...block, ...updates } as MarkdownBlock;
      } else if (block.type === 'python') {
        return { ...block, ...updates } as PythonBlock;
      } else {
        return { ...block, ...updates } as CsvBlock;
      }
    });
    
    setNotebook({
      ...notebook,
      blocks: updatedBlocks
    });
  };
  
  const createBlock = async (type: 'markdown' | 'python' | 'csv', position?: number) => {
    if (!notebook) throw new Error('No notebook loaded');
    
    const now = new Date().toISOString();
    const id = generateUUID();
    const newPosition = position !== undefined ? position : notebook.blocks.length;
    
    // Create file path
    const filePath = `${notebook.id}/${id}.${type === 'markdown' ? 'md' : type === 'python' ? 'py' : 'csv'}`;
    
    // Create new block based on type
    let newBlock: MarkdownBlock | PythonBlock | CsvBlock;
    
    if (type === 'markdown') {
      const markdownBlock: MarkdownBlock = {
        id,
        type: 'markdown',
        filePath,
        position: newPosition,
        created: now,
        updated: now,
        editMode: true
      };
      newBlock = markdownBlock;
    } else if (type === 'python') {
      const pythonBlock: PythonBlock = {
        id,
        type: 'python',
        filePath,
        position: newPosition,
        created: now,
        updated: now,
        output: '',
        isExecuting: false
      };
      newBlock = pythonBlock;
    } else {
      const csvBlock: CsvBlock = {
        id,
        type: 'csv',
        filePath,
        position: newPosition,
        created: now,
        updated: now
      };
      newBlock = csvBlock;
    }
    
    // Update blocks order if inserting at a specific position
    const updatedBlocks = [...notebook.blocks];
    
    if (position !== undefined) {
      // Adjust positions of blocks after the insertion point
      for (let i = 0; i < updatedBlocks.length; i++) {
        if (updatedBlocks[i].position >= newPosition) {
          updatedBlocks[i].position += 1;
        }
      }
    }
    
    // Add the new block
    updatedBlocks.push(newBlock);
    
    // Sort blocks by position
    updatedBlocks.sort((a, b) => a.position - b.position);
    
    // Create the updated notebook object
    const updatedNotebook = {
      ...notebook,
      blocks: updatedBlocks,
      files: [...notebook.files, { path: filePath, type }]
    };

    // Update state
    setNotebook(updatedNotebook);

    // Use the updated object for API call
    try {
      await fetch(`/api/notebooks/${notebook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notebook: updatedNotebook })
      });
    } catch (error) {
      console.error('Failed to update notebook:', error);
    }
    
    // Create file on the server
    try {
      await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: filePath,
          content: ''
        })
      });
    } catch (error) {
      console.error('Failed to create file:', error);
    }
    
    return id;
  };

  const deleteBlock = async (id: string) => {
    if (!notebook) return;
    const deletedFilePath = notebook.blocks.find(block => block.id === id)?.filePath;
    const updatedBlocks = notebook.blocks.filter(block => block.id !== id);
    const updatedFiles = notebook.files.filter(file => file.path !== deletedFilePath);
    const updatedNotebook = { ...notebook, blocks: updatedBlocks, files: updatedFiles };
    setNotebook(updatedNotebook);

    // Use the updated object for API call
    try {
      await fetch(`/api/notebooks/${notebook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notebook: updatedNotebook })
      });
    } catch (error) {
      console.error('Failed to update notebook:', error);
    }

    // Delete file from the server
    if (deletedFilePath) {
      try {
        // Use the correct REST API format for the file path
        await fetch(`/api/files/${deletedFilePath}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
  };

  const moveBlockUp = async (id: string) => {
    if (!notebook) return;
    
    const currentBlock = notebook.blocks.find(block => block.id === id);
    if (!currentBlock) return;
    
    // Find the block with the next lower position (the block above)
    const blockAbove = notebook.blocks
      .filter(block => block.position < currentBlock.position)
      .sort((a, b) => b.position - a.position)[0];
    
    // If there's no block above, do nothing
    if (!blockAbove) return;
    
    // Swap positions
    const updatedBlocks = notebook.blocks.map(block => {
      if (block.id === currentBlock.id) {
        return { ...block, position: blockAbove.position };
      } else if (block.id === blockAbove.id) {
        return { ...block, position: currentBlock.position };
      }
      return block;
    });
    
    // Sort blocks by position
    updatedBlocks.sort((a, b) => a.position - b.position);
    
    const updatedNotebook = { ...notebook, blocks: updatedBlocks };
    setNotebook(updatedNotebook);
    
    // Update on the server
    try {
      await fetch(`/api/notebooks/${notebook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notebook: updatedNotebook })
      });
    } catch (error) {
      console.error('Failed to update notebook:', error);
    }
  };
  
  const moveBlockDown = async (id: string) => {
    if (!notebook) return;
    
    const currentBlock = notebook.blocks.find(block => block.id === id);
    if (!currentBlock) return;
    
    // Find the block with the next higher position (the block below)
    const blockBelow = notebook.blocks
      .filter(block => block.position > currentBlock.position)
      .sort((a, b) => a.position - b.position)[0];
    
    // If there's no block below, do nothing
    if (!blockBelow) return;
    
    // Swap positions
    const updatedBlocks = notebook.blocks.map(block => {
      if (block.id === currentBlock.id) {
        return { ...block, position: blockBelow.position };
      } else if (block.id === blockBelow.id) {
        return { ...block, position: currentBlock.position };
      }
      return block;
    });
    
    // Sort blocks by position
    updatedBlocks.sort((a, b) => a.position - b.position);
    
    const updatedNotebook = { ...notebook, blocks: updatedBlocks };
    setNotebook(updatedNotebook);
    
    // Update on the server
    try {
      await fetch(`/api/notebooks/${notebook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notebook: updatedNotebook })
      });
    } catch (error) {
      console.error('Failed to update notebook:', error);
    }
  };
  
  return (
    <NotebookContext.Provider value={{
      notebook,
      setNotebook,
      selectedBlockId,
      selectBlock,
      updateBlock,
      createBlock,
      deleteBlock,
      moveBlockUp,
      moveBlockDown
    }}>
      {children}
    </NotebookContext.Provider>
  );
}


export function useNotebook() {
  const context = useContext(NotebookContext);
  if (context === undefined) {
    throw new Error('useNotebook must be used within a NotebookProvider');
  }
  return context;
} 