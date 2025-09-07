import { LazyChatWithArtifacts } from '@/components/lazy/lazy-artifacts';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function PageLoader() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">Carregando editor...</p>
      </div>
    </div>
  );
}

export default function ArtifactsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <div className="h-screen w-full">
        <LazyChatWithArtifacts />
      </div>
    </Suspense>
  );
}

export const metadata = {
  title: 'Artifacts - AI Chatbot',
  description: 'Editor de documentos com IA integrada',
};