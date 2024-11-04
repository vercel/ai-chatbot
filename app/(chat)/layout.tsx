import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/custom/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { auth } from '../(auth)/auth';
import { getAgentsByUserId } from '@/db/queries';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const agents = session?.user?.id
    ? await getAgentsByUserId({ userId: session.user.id })
    : Promise.resolve([]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} agents={agents} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
