'use client';

import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function RagTestPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/chat/rag',
      id: 'rag-test',
    });

  const [document, setDocument] = useState({
    title: '',
    content: '',
  });

  const handleDocumentChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setDocument((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (document.title && document.content) {
      const message = `Please save this document with title: "${document.title}" and content: "${document.content}"`;
      const inputElement = window.document.querySelector(
        'input[name="userMessage"]',
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.value = message;
        handleInputChange({
          target: { value: message },
        } as React.ChangeEvent<HTMLInputElement>);
        handleSubmit(e);
      }
      setDocument({ title: '', content: '' });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">RAG Test Interface</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
            <CardDescription>
              Ask questions about your documents
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[400px] overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-100 ml-12'
                      : 'bg-gray-100 mr-12'
                  }`}
                >
                  <p className="font-semibold">
                    {message.role === 'user' ? 'You' : 'AI'}
                  </p>
                  <p className="whitespace-pre-wrap">
                    {message.content || (
                      <span className="text-gray-500 italic">
                        {message.toolInvocations?.[0]?.toolName &&
                          `Using tool: ${message.toolInvocations[0].toolName}...`}
                      </span>
                    )}
                  </p>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p>
                    No messages yet. Start by asking a question or adding a
                    document.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex gap-2">
                <Input
                  name="userMessage"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask a question..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? 'Thinking...' : 'Send'}
                </Button>
              </div>
            </form>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Documents</CardTitle>
            <CardDescription>
              Add documents to the knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium mb-1"
                >
                  Document Title
                </label>
                <Input
                  id="title"
                  name="title"
                  value={document.title}
                  onChange={handleDocumentChange}
                  placeholder="Enter document title"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="content"
                  className="block text-sm font-medium mb-1"
                >
                  Document Content
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={document.content}
                  onChange={handleDocumentChange}
                  placeholder="Enter document content"
                  className="w-full h-32 p-2 border rounded-md"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={!document.title || !document.content || isLoading}
              >
                Add Document
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Add documents using the form on the right</li>
            <li>Ask questions about the documents in the chat interface</li>
            <li>
              The AI will search for relevant information in your documents
            </li>
            <li>
              Try adding multiple documents and asking questions about specific
              topics
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
