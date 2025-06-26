import { auth, type UserType } from '@/app/(auth)/auth';
import { ChatSDKError } from '@/lib/errors';
import { getMessageCountByUserId, getChatById } from '@/lib/db/queries';
import { entitlementsByUserType } from '@/lib/ai/entitlements';

export interface AuthenticatedUser {
  id: string;
  type: UserType;
}

export async function authenticateUser(): Promise<AuthenticatedUser> {
  const session = await auth();

  if (!session?.user) {
    throw new ChatSDKError('unauthorized:chat');
  }

  return {
    id: session.user.id,
    type: session.user.type,
  };
}

export async function validateRateLimit(
  user: AuthenticatedUser,
): Promise<void> {
  const messageCount = await getMessageCountByUserId({
    id: user.id,
    differenceInHours: 24,
  });

  if (messageCount > entitlementsByUserType[user.type].maxMessagesPerDay) {
    throw new ChatSDKError('rate_limit:chat');
  }
}

export async function validateChatAccess(
  chatId: string,
  userId: string,
): Promise<void> {
  const chat = await getChatById({ id: chatId });

  if (chat && chat.userId !== userId) {
    throw new ChatSDKError('forbidden:chat');
  }
}

export async function validateChatOwnership(
  chatId: string,
  userId: string,
): Promise<void> {
  const chat = await getChatById({ id: chatId });

  if (!chat) {
    throw new ChatSDKError('not_found:chat');
  }

  if (chat.userId !== userId) {
    throw new ChatSDKError('forbidden:chat');
  }
}

export async function validateChatVisibility(
  chatId: string,
  userId: string,
): Promise<void> {
  const chat = await getChatById({ id: chatId });

  if (!chat) {
    throw new ChatSDKError('not_found:chat');
  }

  if (chat.visibility === 'private' && chat.userId !== userId) {
    throw new ChatSDKError('forbidden:chat');
  }
}
