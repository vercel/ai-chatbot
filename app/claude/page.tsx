import { ClaudeChat } from '@/components/claude-chat';

export default function ClaudePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto h-screen">
        <ClaudeChat />
      </div>
    </div>
  );
}