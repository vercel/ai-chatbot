import { withAuth } from '@workos-inc/authkit-nextjs';
import {
  getDatabaseUserFromWorkOS,
  getSuggestionsByDocumentId,
} from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return new ChatSDKError(
      'bad_request:api',
      'Parameter documentId is required.',
    ).toResponse();
  }

  const session = await withAuth();

  if (!session?.user) {
    return new ChatSDKError('unauthorized:suggestions').toResponse();
  }

  // Get the database user from the WorkOS user
  const databaseUser = await getDatabaseUserFromWorkOS({
    id: session.user.id,
    email: session.user.email,
    firstName: session.user.firstName ?? undefined,
    lastName: session.user.lastName ?? undefined,
  });

  if (!databaseUser) {
    return new ChatSDKError(
      'unauthorized:suggestions',
      'User not found',
    ).toResponse();
  }

  const suggestions = await getSuggestionsByDocumentId({
    documentId,
  });

  const [suggestion] = suggestions;

  if (!suggestion) {
    return Response.json([], { status: 200 });
  }

  if (suggestion.userId !== databaseUser.id) {
    return new ChatSDKError('forbidden:api').toResponse();
  }

  return Response.json(suggestions, { status: 200 });
}
