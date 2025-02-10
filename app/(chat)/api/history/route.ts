import { getChatsByUserId } from '@/lib/db/queries';
import { getTypedUser } from '@/lib/auth';  

export async function GET() {
  const user = await getTypedUser();

  if (!user || !user.id) {
    return Response.json('Unauthorized!', { status: 401 });
  }

  // biome-ignore lint: Forbidden non-null assertion.
  const chats = await getChatsByUserId({ id: user.id! });
  return Response.json(chats);
}
