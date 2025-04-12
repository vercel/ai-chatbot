import { auth } from '@/app/(auth)/auth';
import type { ArtifactKind } from '@/components/artifact';
import {
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from '@/lib/db/queries';
import { apiErrors, successResponse } from '@/lib/responses';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return apiErrors.missingParameter();
  }

  const session = await auth();

  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (!document) {
    return apiErrors.documentNotFound();
  }

  if (document.userId !== session.user.id) {
    return apiErrors.documentForbidden();
  }

  return successResponse(documents);
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return apiErrors.missingParameter();
  }

  const session = await auth();

  if (!session) {
    return apiErrors.unauthorized();
  }

  const {
    content,
    title,
    kind,
  }: { content: string; title: string; kind: ArtifactKind } =
    await request.json();

  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const documents = await getDocumentsById({ id: id });

  if (documents.length > 0) {
    const [document] = documents;

    if (document.userId !== session.user.id) {
      return apiErrors.documentForbidden();
    }
  }

  const [createdDocument] = await saveDocument({
    id,
    content,
    title,
    kind,
    userId: session.user.id,
  });

  return successResponse(createdDocument);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const timestamp = searchParams.get('timestamp');

  if (!id) {
    return apiErrors.missingParameter();
  }

  if (!timestamp) {
    return apiErrors.missingParameter();
  }

  const session = await auth();

  if (!session?.user?.id) {
    return apiErrors.unauthorized();
  }

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (document.userId !== session.user.id) {
    return apiErrors.documentForbidden();
  }

  const deletedDocuments = await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  });

  return successResponse(deletedDocuments);
}
