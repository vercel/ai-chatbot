// import { createClient } from '@/lib/supabase/server'; // REMOVE SUPABASE
import { auth } from '@clerk/nextjs/server'; // ADD CLERK
// Remove duplicate import: import { db } from '@/lib/db/queries'; // Need DB for profile lookup
import * as schema from '@/lib/db/schema'; // Need schema for profile lookup
import { eq } from 'drizzle-orm'; // Need eq for profile lookup
import type { ArtifactKind } from '@/components/artifact';
import {
  db, // Already consolidated here
  deleteDocumentsByIdAfterTimestamp,
  getDocumentsById,
  saveDocument,
} from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  // --- CLERK AUTH & PROFILE LOOKUP ---
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const profile = await db.query.userProfiles.findFirst({
    columns: { id: true },
    where: eq(schema.userProfiles.clerkId, clerkUserId),
  });
  if (!profile) {
    return new Response('User profile not found', { status: 404 });
  }
  const userId = profile.id; // Use the internal profile UUID
  // --- END AUTH ---

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  if (!document) {
    return new Response('Not Found', { status: 404 });
  }

  // Check ownership using the internal profile UUID
  if (document.userId !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  return Response.json(documents, { status: 200 });
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  // --- CLERK AUTH & PROFILE LOOKUP ---
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const profile = await db.query.userProfiles.findFirst({
    columns: { id: true },
    where: eq(schema.userProfiles.clerkId, clerkUserId),
  });
  if (!profile) {
    return new Response('User profile not found', { status: 404 });
  }
  const userId = profile.id; // Use the internal profile UUID
  // --- END AUTH ---

  const {
    content,
    title,
    kind,
    chatId,
  }: { content: string; title: string; kind: ArtifactKind; chatId: string } =
    await request.json();

  // Save document using the internal profile UUID
  const document = await saveDocument({
    id,
    content,
    title,
    kind,
    userId: userId,
    chatId: chatId,
    createdAt: new Date(),
  });

  return Response.json(document, { status: 200 });
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  const { timestamp }: { timestamp: string } = await request.json();

  if (!id) {
    return new Response('Missing id', { status: 400 });
  }

  // --- CLERK AUTH & PROFILE LOOKUP ---
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return new Response('Unauthorized', { status: 401 });
  }
  const profile = await db.query.userProfiles.findFirst({
    columns: { id: true },
    where: eq(schema.userProfiles.clerkId, clerkUserId),
  });
  if (!profile) {
    return new Response('User profile not found', { status: 404 });
  }
  const userId = profile.id; // Use the internal profile UUID
  // --- END AUTH ---

  const documents = await getDocumentsById({ id });

  const [document] = documents;

  // Add check for document existence before checking ownership
  if (!document) {
    return new Response('Document not found', { status: 404 });
  }

  // Check ownership using the internal profile UUID
  if (document.userId !== userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  await deleteDocumentsByIdAfterTimestamp({
    id,
    timestamp: new Date(timestamp),
  });

  return new Response('Deleted', { status: 200 });
}
