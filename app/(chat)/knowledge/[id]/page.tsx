import { auth } from '@/app/(auth)/auth';
import { redirect, notFound } from 'next/navigation';
import { 
  getKnowledgeDocumentById, 
  getChunksByDocumentId 
} from '@/lib/db/queries';
import { KnowledgeDocumentDetail } from '@/components/knowledge-document-detail';

export default async function KnowledgeDocumentPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  const document = await getKnowledgeDocumentById({
    id: params.id,
  });

  if (!document) {
    notFound();
  }

  // Check if the user owns this document
  if (document.userId !== session.user.id) {
    notFound();
  }

  const chunks = await getChunksByDocumentId({
    documentId: params.id,
  });

  return (
    <div className="flex flex-col w-full h-full">
      <KnowledgeDocumentDetail 
        document={document}
        chunks={chunks}
      />
    </div>
  );
} 