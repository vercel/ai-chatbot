import { auth } from '@/app/(auth)/auth';
import {
  saveMemory,
  getMemoriesByUserId,
  getMemoryCountByUserId,
} from '@/lib/db/queries';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ChatSDKError } from '@/lib/errors';

const createMemorySchema = z.object({
  content: z.string().min(1).max(1000),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).default([]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:memory').toResponse();
    }

    const body = await request.json();
    const { content, category, tags } = createMemorySchema.parse(body);

    // Check memory limit
    const memoryCount = await getMemoryCountByUserId({
      userId: session.user.id,
    });
    if (memoryCount >= 100) {
      return new ChatSDKError('rate_limit:memory').toResponse();
    }

    const memory = await saveMemory({
      userId: session.user.id,
      content,
      category,
      tags,
    });

    return Response.json(memory);
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

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:memory').toResponse();
    }

    const url = new URL(request.url);
    const limit = Number.parseInt(url.searchParams.get('limit') || '100');

    const memories = await getMemoriesByUserId({
      userId: session.user.id,
      limit: Math.min(limit, 100),
    });

    return Response.json(memories);
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}
