import { cookies } from 'next/headers';

import { getChatsByUserId } from '@/db/queries';

export async function GET() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user')?.value ?? '';

  const chats = await getChatsByUserId({ id: userId });
  return Response.json(chats);
}
