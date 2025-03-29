import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { NotebookProvider } from '@/lib/contexts/notebook-context';
import { Toaster } from 'sonner';
import '@/app/globals.css';
import { NotebookChatSidebar } from '@/components/notebook-chat-sidebar';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from '@/components/ui/resizable';

export const metadata: Metadata = {
  title: 'Notebook',
  description: 'Interactive notebook with AI assistance',
};

export default function NotebookLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NotebookProvider>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={75} minSize={40}>
                {children}
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={25} minSize={20}>
                <div className="h-screen overflow-hidden border-l border-muted">
                  <NotebookChatSidebar />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
            <Toaster position="bottom-right" />
          </NotebookProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 