import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { KnowledgeBase } from '@/components/knowledge-base';
import { getKnowledgeDocumentsByUserId } from '@/lib/db/queries';

export default async function KnowledgeBasePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/sign-in');
  }

  const documents = await getKnowledgeDocumentsByUserId({
    userId: session.user.id,
  });

  return (
    <div className="flex flex-col w-full h-full">
      <KnowledgeBase 
        initialDocuments={documents} 
        userId={session.user.id} 
      />
    </div>
  );
} 