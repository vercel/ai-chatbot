"use client";

import { ReactNode } from 'react';
import { useNotebook } from '@/lib/contexts/notebook-context';
import { Block } from '@/lib/types';

interface BlockWrapperProps {
  block: Block;
  children: ReactNode;
}

export default function BlockWrapper({ block, children }: BlockWrapperProps) {
  const { selectedBlockId, selectBlock } = useNotebook();
  
  const isSelected = selectedBlockId === block.id;
  
  return (
    <div 
      className={`relative border rounded-md p-4 mb-4 ${isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-200 hover:border-gray-300'}`}
      onClick={() => selectBlock(block.id)}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm text-gray-500">
          {block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block
          {block.title && ` - ${block.title}`}
        </div>
        
        <div className="flex space-x-2">
          {/* Block controls to be added */}
        </div>
      </div>
      
      {children}
    </div>
  );
} 