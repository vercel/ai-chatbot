'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { generateUUID } from '@/lib/utils';
import { useNotebook } from '@/lib/contexts/notebook-context';
import { toast } from 'sonner';
import { SuggestedActions } from '@/components/suggested-actions';

interface NotebookChatProps {
  id: string;
  selectedChatModel: string;
}

export function NotebookIntegratedChat({ id, selectedChatModel }: NotebookChatProps) {
  const { notebook, selectedBlockId } = useNotebook();
  const { mutate } = useSWRConfig();

  // Get selected block information for context
  const selectedBlock = notebook?.blocks.find(block => block.id === selectedBlockId);

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
  } = useChat({
    id,
    body: { 
      id, 
      selectedChatModel,
      notebookContext: selectedBlock ? {
        blockId: selectedBlock.id,
        blockType: selectedBlock.type,
        notebookId: notebook?.id,
      } : undefined
    },
    initialMessages: [],
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    onFinish: () => {
      mutate('/api/history');
    },
    onError: () => {
      toast.error('An error occurred, please try again!');
    },
  });

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);

  // Custom suggestions based on block type
  const getSuggestions = () => {
    if (!selectedBlock) return [];

    switch (selectedBlock.type) {
      case 'markdown':
        return [
          { id: 'md-1', text: 'Improve this text', content: 'Can you help me improve this markdown text?' },
          { id: 'md-2', text: 'Format content', content: 'How should I format this content better?' },
          { id: 'md-3', text: 'Generate headings', content: 'Generate appropriate headings for this content' },
        ];
      case 'python':
        return [
          { id: 'py-1', text: 'Explain code', content: 'Explain what this code does' },
          { id: 'py-2', text: 'Optimize code', content: 'How can I optimize this code?' },
          { id: 'py-3', text: 'Fix bugs', content: 'Help me find and fix bugs in this code' },
        ];
      case 'csv':
        return [
          { id: 'csv-1', text: 'Analyze data', content: 'Analyze this CSV data' },
          { id: 'csv-2', text: 'Visualization tips', content: 'What visualizations would be good for this data?' },
          { id: 'csv-3', text: 'Data cleaning', content: 'How should I clean this data?' },
        ];
      default:
        return [];
    }
  };

  const handleSuggestedAction = (content: string) => {
    const formData = new FormData();
    formData.append('message', content);
    handleSubmit(formData as any);
  };

  // Render suggestions only if there are no messages yet
  const showSuggestions = messages.length === 0 && selectedBlockId;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground text-sm">
              {selectedBlockId 
                ? "Ask me about this block or try one of these:" 
                : "Start a new conversation or select a block to work with."}
            </p>
            
            {showSuggestions && (
              <SuggestedActions 
                suggestions={getSuggestions()}
                onAction={handleSuggestedAction}
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, i) => (
              <div 
                key={i}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-3/4 rounded-lg px-4 py-2 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-none' 
                      : 'bg-muted text-muted-foreground rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}

            {status === 'streaming' && (
              <div className="flex justify-start">
                <div className="max-w-3/4 rounded-lg px-4 py-2 bg-muted text-muted-foreground rounded-bl-none">
                  <div className="animate-pulse">...</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="border-t p-4">
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) return;
          
          const formData = new FormData();
          formData.append('message', input);
          handleSubmit(formData as any);
        }} className="flex flex-col space-y-2">
          <div className="text-xs text-gray-500 pb-1">
            {selectedBlockId ? (
              <span className="text-green-600">
                Block selected: {selectedBlock?.type}
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border rounded-l-md px-3 py-2"
              placeholder={selectedBlockId ? `Ask about this ${selectedBlock?.type} block...` : "Ask about your notebook..."}
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-r-md"
              disabled={!input.trim() || status === 'streaming'}
              onClick={() => status === 'streaming' && stop()}
            >
              {status === 'streaming' ? 'Stop' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 