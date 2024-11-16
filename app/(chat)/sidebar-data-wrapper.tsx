import type { User } from 'next-auth';
import { getChatsByUserId } from '@/lib/db/queries';
import { unstable_cacheTag as cacheTag } from 'next/cache';
import { SidebarHistory } from '@/components/sidebar-history';

export async function getChats(id: string) {
  'use cache';
  cacheTag('history');
  const chats = await getChatsByUserId({ id });
  return chats;
}

export async function SidebarDataWrapper({ user }: { user: User }) {
  // biome-ignore lint: Forbidden non-null assertion.
  const chats = await getChats(user?.id!);
  return <SidebarHistory user={user} history={chats} />;
}
