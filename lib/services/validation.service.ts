import { ChatSDKError } from '@/lib/errors';
import {
  postRequestBodySchema,
  type PostRequestBody,
} from '@/app/(chat)/api/chat/schema';

export async function validatePostRequest(
  request: Request,
): Promise<PostRequestBody> {
  try {
    const json = await request.json();
    return postRequestBodySchema.parse(json);
  } catch (error) {
    throw new ChatSDKError('bad_request:api');
  }
}

export function validateChatId(chatId: string | null): string {
  if (!chatId) {
    throw new ChatSDKError('bad_request:api');
  }
  return chatId;
}

export function validateDeleteId(id: string | null): string {
  if (!id) {
    throw new ChatSDKError('bad_request:api');
  }
  return id;
}
