"use client";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatMessagesProps {
  messages: Message[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-4">
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {messages.map((message, index) => (
        <div 
          key={index}
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
    </div>
  );
} 