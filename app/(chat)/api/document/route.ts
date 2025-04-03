import { auth } from '@/app/(auth)/auth';
import { chatConfig } from '@/lib/chat-config';
import { ArtifactKind } from '@/components/artifact';
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from '@/lib/db/queries';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: ArtifactKind } =
    await request.json();

  if (chatConfig.guestUsage.isEnabled) {
    const guestUserId = process.env.GUEST_USER_ID;

    if (!guestUserId) {
      throw new Error('Guest user ID is not set!');
    }

    const document = await saveDocument({
      id,
      content,
      title,
      kind,
      userId: guestUserId,
    });

    return Response.json(document, { status: 200 });
  } else {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const document = await saveDocument({
      id,
      content,
      title,
      kind,
      userId: session.user.id,
    });

    return Response.json(document, { status: 200 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  if (chatConfig.guestUsage.isEnabled) {
    const documents = await getDocumentsById({ id });
    const [document] = documents;

    if (!document) {
      return new Response('Not Found', { status: 404 });
    }

    if (document.userId !== process.env.GUEST_USER_ID) {
      return new Response('Unauthorized', { status: 401 });
    }

    return Response.json(documents, { status: 200 });
  } else {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const documents = await getDocumentsById({ id });

    const [document] = documents;

    if (!document) {
      return new Response('Not Found', { status: 404 });
    }

    if (document.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    return Response.json(documents, { status: 200 });
  }
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { timestamp }: { timestamp: string } = await request.json();

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  if (chatConfig.guestUsage.isEnabled) {
    const documents = await getDocumentsById({ id });
    const [document] = documents;

    if (document.userId !== process.env.GUEST_USER_ID) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteDocumentsByIdAfterTimestamp({
      id,
      timestamp: new Date(timestamp),
    });

    return new Response('Deleted', { status: 200 });
  } else {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const documents = await getDocumentsById({ id });

    const [document] = documents;

    if (document.userId !== session.user.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    await deleteDocumentsByIdAfterTimestamp({
      id,
      timestamp: new Date(timestamp),
    });

    return new Response('Deleted', { status: 200 });
  }
}
