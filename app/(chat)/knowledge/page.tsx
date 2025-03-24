import { auth } from '@/app/(auth)/auth';
import { getKnowledgeDocumentsByUserId, getChunksByDocumentId } from '@/lib/db/queries';
import { KnowledgeTable } from '@/components/knowledge-table';
import { redirect } from 'next/navigation';

export default async function KnowledgeBasePage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }

  // Fetch all knowledge documents for the user
  const documents = await getKnowledgeDocumentsByUserId({
    userId: session.user.id
  });
  
  // Create a map of document chunks for size calculation
  const chunks = {};
  
  // For performance reasons, we're not loading all chunks for all documents
  // In a production app, you might want to store document sizes in the document record itself
  // Or implement pagination and only load chunks for the current page
  
  return <KnowledgeTable initialDocuments={documents} chunks={chunks} />;
}