import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { chat } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Find the system chat for this user
    const systemChats = await db
      .select()
      .from(chat)
      .where(
        and(
          eq(chat.title, '[RESEARCH AGENT]'),
          eq(chat.userId, session.user.id as string)
        )
      );
    
    if (systemChats.length === 0) {
      // If no system chat exists, ensure one is created
      const { ensureUserHasSystemChat } = await import('@/lib/cron');
      await ensureUserHasSystemChat(session.user.id as string);
      
      // Try to fetch it again
      const newSystemChats = await db
        .select()
        .from(chat)
        .where(
          and(
            eq(chat.title, '[RESEARCH AGENT]'),
            eq(chat.userId, session.user.id as string)
          )
        );
      
      if (newSystemChats.length === 0) {
        return new Response('Research agent chat not found', { status: 404 });
      }
      
      return Response.json({ id: newSystemChats[0].id });
    }
    
    return Response.json({ id: systemChats[0].id });
  } catch (error) {
    console.error('Error fetching research agent chat ID:', error);
    return new Response('Error fetching research agent chat ID', { status: 500 });
  }
} 