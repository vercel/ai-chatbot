'use server';

import { cookies } from 'next/headers';

export async function saveChatModeAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set('chat-mode', model);
}
