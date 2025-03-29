"use client";
import { ReactNode } from 'react';
import { NotebookProvider } from '@/lib/contexts/notebook-context';
import ChatSidebar from '@/components/chat/ChatSidebar';

export default function NotebookLayout({ children }: { children: ReactNode }) {
  return (
    <NotebookProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="flex-1 overflow-auto px-4 py-6">
          {children}
        </div>
        
        <div className="w-96 border-l bg-background overflow-auto">
          <ChatSidebar />
        </div>
      </div>
    </NotebookProvider>
  );
} 