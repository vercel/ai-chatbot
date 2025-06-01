import { auth } from '@/app/(auth)/auth';
import {
  getUserMemorySettings,
  updateUserMemorySettings,
} from '@/lib/db/queries';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { ChatSDKError } from '@/lib/errors';

const updateSettingsSchema = z.object({
  memoryCollectionEnabled: z.boolean(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:memory').toResponse();
    }

    const settings = await getUserMemorySettings({ userId: session.user.id });

    return Response.json(settings);
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api').toResponse();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:memory').toResponse();
    }

    const body = await request.json();
    const { memoryCollectionEnabled } = updateSettingsSchema.parse(body);

    const updatedSettings = await updateUserMemorySettings({
      userId: session.user.id,
      memoryCollectionEnabled,
    });

    return Response.json(updatedSettings);
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
