import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';

export default async function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/sign-in');
  }
  
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {children}
    </div>
  );
} 