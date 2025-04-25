import { db } from '@/lib/db/queries';
import { Chat, Message_v2 } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';

// Removed unused type import
// import type { message as MessageTableType } from '@/lib/db/schema';

export async function getChat(id: string) {
  try {
    // Ensure the query returns the necessary fields implicitly
    // Drizzle includes all columns by default when using `findFirst` without `columns`
    // and includes relations specified in `with`.
    const chatData = await db.query.Chat.findFirst({
      where: eq(Chat.id, id),
      with: {
        messages: {
          orderBy: (messagesTable, { asc }) => [asc(messagesTable.createdAt)],
        },
      },
    });

    // The return type should now be inferred correctly based on the updated schema relations
    return chatData;
  } catch (error) {
    console.error('Error getting chat:', error);
    throw error;
  }
}
