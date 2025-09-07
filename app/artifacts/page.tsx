import { ChatWithArtifacts } from '@/components/chat/chat-with-artifacts';

export default function ArtifactsPage() {
  return (
    <div className="h-screen w-full">
      <ChatWithArtifacts />
    </div>
  );
}

export const metadata = {
  title: 'Artifacts - AI Chatbot',
  description: 'Editor de documentos com IA integrada',
};