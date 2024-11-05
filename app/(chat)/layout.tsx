import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/custom/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getAgentsByUserId } from '@/db/queries';
import { type Agent } from '@/db/schema';

import { auth } from '../(auth)/auth';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const agents = session?.user?.id
    ? await getAgentsByUserId({ userId: session.user.id })
    : await Promise.resolve([] as Agent[]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} agents={agents} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
