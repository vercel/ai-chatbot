import { auth } from '@/app/(auth)/auth';
import { getChatById } from '@/lib/db/queries';

// Using type assertion to bypass the type checking
export const GET = (async (
  req: Request,
  context: any
) => {
  // Extract id from context
  const id = context.params.id;
  
  const session = await auth();
  
  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    const chat = await getChatById({ id });
    
    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }
    
    if (chat.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    return Response.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return new Response('Error fetching chat', { status: 500 });
  }
}) as any;