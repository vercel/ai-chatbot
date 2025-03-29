"use client";
import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { useNotebook } from '@/lib/contexts/notebook-context';
import { useSWRConfig } from 'swr';
import { ModelSelector } from '@/components/model-selector';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PlusIcon } from '@/components/icons';
import { generateUUID } from '@/lib/utils';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { saveChatModelAsCookie } from '@/app/(chat)/actions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatSidebar() {
  const { notebook, selectedBlockId } = useNotebook();
  const [selectedChatModel, setSelectedChatModel] = useState(DEFAULT_CHAT_MODEL);
  const [chatId, setChatId] = useState(() => generateUUID());
  const { mutate } = useSWRConfig();

  // Listen for model changes via cookies
  useEffect(() => {
    const getCookieValue = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const modelFromCookie = getCookieValue('chat-model');
    if (modelFromCookie) {
      setSelectedChatModel(modelFromCookie);
    }

    // Set up an event listener for cookie changes
    const handleStorageChange = () => {
      const newModelFromCookie = getCookieValue('chat-model');
      if (newModelFromCookie && newModelFromCookie !== selectedChatModel) {
        setSelectedChatModel(newModelFromCookie);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedChatModel]);

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
    id: chatId,
    body: { 
      id: chatId, 
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

  const startNewChat = () => {
    const newChatId = generateUUID();
    setChatId(newChatId);
    setMessages([]);
    setInput('');
  };

  const handleSendMessage = (content: string) => {
    const formData = new FormData();
    formData.append('message', content);
    handleSubmit(formData as any);
  };

  const suggestedActions = [
    { title: "Explain this block", prompt: "Explain this block in simple terms" },
    { title: "Suggest improvements", prompt: "How can I improve this block?" },
    { title: "Generate content", prompt: "Generate sample content for this block" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="bg-primary p-4 text-primary-foreground">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">AI Assistant</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="px-2 h-8"
                  onClick={startNewChat}
                >
                  <PlusIcon />
                  <span className="sr-only">New Chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Chat</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <ModelSelector
          selectedModelId={selectedChatModel}
          className="w-full mb-2"
        />
        
        {selectedBlockId && (
          <div className="text-sm opacity-90 mt-1 bg-primary-foreground/10 p-2 rounded">
            Working with: {selectedBlock?.type} block
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground text-sm">
              {selectedBlockId 
                ? "Ask me about this block or try one of these:" 
                : "Start a new conversation or select a block to work with."}
            </p>
            
            {selectedBlockId && (
              <div className="grid gap-2">
                {suggestedActions.map((action, i) => (
                  <button
                    key={i}
                    className="p-3 bg-muted text-left rounded-lg hover:bg-muted/80 transition-colors text-sm"
                    onClick={() => handleSendMessage(action.prompt)}
                  >
                    {action.title}
                  </button>
                ))}
              </div>
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
          handleSendMessage(input);
        }} className="flex flex-col space-y-2">
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
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border rounded-l-md px-3 py-2"
              placeholder={selectedBlockId ? "Ask about this block..." : "Ask about your notebook..."}
            />
            <Button
              type="submit"
              className="bg-primary text-primary-foreground px-4 py-2 rounded-r-md"
              disabled={!input.trim() || status === 'streaming'}
              onClick={() => status === 'streaming' && stop()}
            >
              {status === 'streaming' ? 'Stop' : 'Send'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 