"use client";

import { useState } from 'react';
import { useNotebook } from '@/lib/contexts/notebook-context';
import { Block } from '@/lib/types';

interface BlockControlsProps {
  block: Block;
}

export default function BlockControls({ block }: BlockControlsProps) {
  const { notebook, createBlock, deleteBlock, moveBlockUp, moveBlockDown } = useNotebook();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  if (!notebook) return null;
  
  const handleAddBlock = async (type: 'markdown' | 'python' | 'csv') => {
    await createBlock(type, block.position + 1);
    setIsMenuOpen(false);
  };
  
  const handleDeleteBlock = async () => {
    await deleteBlock(block.id);
    setIsMenuOpen(false);
  };
  
  const handleMoveUp = async () => {
    await moveBlockUp(block.id);
    setIsMenuOpen(false);
  };
  
  const handleMoveDown = async () => {
    await moveBlockDown(block.id);
    setIsMenuOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        className="p-1 rounded-md hover:bg-gray-100"
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      
      {isMenuOpen && (
        <div 
          className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1">
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleAddBlock('markdown')}
            >
              Add Markdown Block Below
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleAddBlock('python')}
            >
              Add Python Block Below
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleAddBlock('csv')}
            >
              Add CSV Block Below
            </button>
            <hr className="my-1" />
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleMoveUp}
              disabled={block.position === 0}
            >
              Move Up
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={handleMoveDown}
              disabled={notebook && block.position === notebook.blocks.length - 1}
            >
              Move Down
            </button>
            <hr className="my-1" />
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              onClick={handleDeleteBlock}
            >
              Delete Block
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 