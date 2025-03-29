"use client";
import { useState } from 'react';
import { useNotebook } from '@/lib/contexts/notebook-context';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const { selectedBlockId } = useNotebook();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    onSendMessage(message);
    setMessage('');
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
      <div className="text-xs text-gray-500 pb-1">
        {selectedBlockId ? (
          <span className="text-green-600">
            Block selected
          </span>
        ) : (
          <span>
            No block selected
          </span>
        )}
      </div>
      
      <div className="flex space-x-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 border rounded-l-md px-3 py-2"
          placeholder={selectedBlockId ? "Ask about this block..." : "Ask about your notebook..."}
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-r-md"
          disabled={!message.trim()}
        >
          Send
        </button>
      </div>
    </form>
  );
} 