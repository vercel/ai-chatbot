import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { withAuth } from '@workos-inc/authkit-nextjs';

import { getAgentBySlug, getDatabaseUserFromWorkOS } from '@/lib/db/queries';

import { EditAgentPageClient } from './edit-agent-page-client';
import { EditAgentPageSkeleton } from './skeletons';

interface PageParams {
  params: Promise<{ slug: string }>;
}

async function EditAgentPageContent({ params }: PageParams) {
  const { slug } = await params;
  const { user } = await withAuth({ ensureSignedIn: true });

  if (!user) {
    notFound();
  }

  const databaseUser = await getDatabaseUserFromWorkOS({
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
  });

  if (!databaseUser) {
    notFound();
  }

  const agent = await getAgentBySlug({ slug });

  if (!agent || agent.userId !== databaseUser.id) {
    notFound();
  }

  return <EditAgentPageClient agent={agent} user={user} />;
}

export default function EditAgentPage(props: PageParams) {
  return (
    <Suspense fallback={<EditAgentPageSkeleton />}>
      <EditAgentPageContent {...props} />
    </Suspense>
  );
}
