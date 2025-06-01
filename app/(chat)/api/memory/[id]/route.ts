import { auth } from '@/app/(auth)/auth';
import { getMemoryById, updateMemory, deleteMemory } from '@/lib/db/queries';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ChatSDKError } from '@/lib/errors';

const updateMemorySchema = z.object({
  content: z.string().min(1).max(1000).optional(),
  category: z.string().min(1).max(100).optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:memory').toResponse();
    }

    const { id } = await params;
    const memory = await getMemoryById({ id });

    if (!memory) {
      return new ChatSDKError('not_found:memory').toResponse();
    }

    if (memory.userId !== session.user.id) {
      return new ChatSDKError('forbidden:memory').toResponse();
    }

    return Response.json(memory);
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:memory').toResponse();
    }

    const { id } = await params;
    const memory = await getMemoryById({ id });

    if (!memory) {
      return new ChatSDKError('not_found:memory').toResponse();
    }

    if (memory.userId !== session.user.id) {
      return new ChatSDKError('forbidden:memory').toResponse();
    }

    const body = await request.json();
    const updateData = updateMemorySchema.parse(body);

    const updatedMemory = await updateMemory({
      id,
      ...updateData,
    });

    return Response.json(updatedMemory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new ChatSDKError('bad_request:memory').toResponse();
    }
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:memory').toResponse();
    }

    const { id } = await params;
    const memory = await getMemoryById({ id });

    if (!memory) {
      return new ChatSDKError('not_found:memory').toResponse();
    }

    if (memory.userId !== session.user.id) {
      return new ChatSDKError('forbidden:memory').toResponse();
    }

    const deletedMemory = await deleteMemory({ id });

    return Response.json(deletedMemory);
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}
