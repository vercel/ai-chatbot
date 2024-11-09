import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/custom/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';
  const userId = cookieStore.get('user')?.value ?? ''

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar userId={userId} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
