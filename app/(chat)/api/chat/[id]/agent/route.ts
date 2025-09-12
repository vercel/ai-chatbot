import { withAuth } from '@workos-inc/authkit-nextjs';
import { getDatabaseUserFromWorkOS, getChatWithAgent } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await withAuth({ ensureSignedIn: true });

    // Get the database user from the WorkOS user
    const databaseUser = await getDatabaseUserFromWorkOS({
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.firstName ?? undefined,
      lastName: session.user.lastName ?? undefined,
    });

    if (!databaseUser) {
      return new ChatSDKError(
        'unauthorized:chat',
        'User not found',
      ).toResponse();
    }

    const chatData = await getChatWithAgent(id, databaseUser.id);

    if (chatData?.agent) {
      return Response.json({
        agentName: chatData.agent.name,
        agentDescription: chatData.agent.description,
        agentPrompt: chatData.agent.agentPrompt,
      });
    }

    return Response.json(null);
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    console.error('Unhandled error in chat agent API:', error);
    return new ChatSDKError('offline:chat').toResponse();
  }
}
