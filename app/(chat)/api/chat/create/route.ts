import { auth } from '@/app/(auth)/auth';
import { saveChat } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const data = await request.json();
    const { id, title } = data;

    if (!id) {
      return new Response('Missing chat ID', { status: 400 });
    }

    // Authenticate the request
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Create the chat
    const chat = await saveChat({
      id,
      userId: session.user.id,
      title: title || 'New Chat'
    });

    // Return the created chat
    return new Response(JSON.stringify(chat), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return new Response(JSON.stringify({ error: 'Failed to create chat' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}
