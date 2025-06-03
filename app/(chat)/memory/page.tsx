import { auth } from '@/app/(auth)/auth';
import { getMemoriesByUserId, getUserMemorySettings } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { MemoryPage } from '@/components/memory-page';

export default async function Memory() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/');
  }

  const [memories, userSettings] = await Promise.all([
    getMemoriesByUserId({ userId: session.user.id }),
    getUserMemorySettings({ userId: session.user.id }),
  ]);

  return (
    <MemoryPage
      memories={memories}
      memoryCollectionEnabled={userSettings?.memoryCollectionEnabled ?? true}
      userId={session.user.id}
    />
  );
}
