import { ChatProvider } from '@/apps/web/lib/chat/context';
import { ConversationStream } from '@/apps/web/components/chat/ConversationStream';
import { PromptBar } from '@/apps/web/components/chat/PromptBar';

export default function Page() {
  return (
    <ChatProvider api="/api/test-chat">
      <div className="flex flex-col h-screen">
        <ConversationStream />
        <PromptBar />
      </div>
    </ChatProvider>
  );
}
