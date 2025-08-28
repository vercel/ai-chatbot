'use client';

import {
  Conversation,
  ConversationContent,
} from '@/components/elements/conversation';
import { Loader } from '@/components/elements/loader';
import { Message, MessageContent } from '@/components/elements/message';
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/elements/prompt-input';
import { Suggestion, Suggestions } from '@/components/elements/suggestion';
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewUrl,
} from '@/components/elements/web-preview';
import { nanoid } from 'nanoid';
import { useState } from 'react';

interface Chat {
  id: string;
  demo: string;
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{
      id: string;
      type: 'user' | 'assistant';
      content: string;
    }>
  >([]);

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);

    setChatHistory((prev) => [
      ...prev,
      { id: nanoid(), type: 'user', content: userMessage },
    ]);

    try {
      const response = await fetch('/api/v0', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          chatId: currentChat?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create chat');
      }

      const chat: Chat = await response.json();
      setCurrentChat(chat);

      setChatHistory((prev) => [
        ...prev,
        {
          id: nanoid(),
          type: 'assistant',
          content: 'Generated new app preview. Check the preview panel!',
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setChatHistory((prev) => [
        ...prev,
        {
          id: nanoid(),
          type: 'assistant',
          content:
            'Sorry, there was an error creating your app. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[800px]">
      {/* Chat Panel */}
      <div className="flex w-1/2 flex-col border-r">
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b p-3">
          <h1 className="font-semibold text-lg">v0 Clone</h1>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {chatHistory.length === 0 ? (
            <div className="mt-8 text-center font-semibold">
              <p className="mt-4 text-3xl">What can we build together?</p>
            </div>
          ) : (
            <>
              <Conversation>
                <ConversationContent>
                  {chatHistory.map((msg) => (
                    <Message from={msg.type} key={msg.id}>
                      <MessageContent>{msg.content}</MessageContent>
                    </Message>
                  ))}
                </ConversationContent>
              </Conversation>
              {isLoading && (
                <Message from="assistant">
                  <MessageContent>
                    <p className="flex items-center gap-2">
                      <Loader />
                      Creating your app...
                    </p>
                  </MessageContent>
                </Message>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4">
          {!currentChat && (
            <Suggestions>
              <Suggestion
                onClick={() =>
                  setMessage('Create a responsive navbar with Tailwind CSS')
                }
                suggestion="Create a responsive navbar with Tailwind CSS"
              />
              <Suggestion
                onClick={() => setMessage('Build a todo app with React')}
                suggestion="Build a todo app with React"
              />
              <Suggestion
                onClick={() =>
                  setMessage('Make a landing page for a coffee shop')
                }
                suggestion="Make a landing page for a coffee shop"
              />
            </Suggestions>
          )}
          <div className="flex gap-2">
            <PromptInput
              className="relative mx-auto mt-4 w-full max-w-2xl"
              onSubmit={handleSendMessage}
            >
              <PromptInputTextarea
                className="min-h-[60px] pr-12"
                onChange={(e) => setMessage(e.target.value)}
                value={message}
              />
              <PromptInputSubmit
                className="absolute right-1 bottom-1"
                disabled={!message}
                status={isLoading ? 'streaming' : 'ready'}
              />
            </PromptInput>
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="flex w-1/2 flex-col">
        <WebPreview>
          <WebPreviewNavigation>
            <WebPreviewUrl
              placeholder="Your app here..."
              value={currentChat?.demo}
            />
          </WebPreviewNavigation>
          <WebPreviewBody src={currentChat?.demo} />
        </WebPreview>
      </div>
    </div>
  );
}
