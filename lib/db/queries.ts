import 'server-only';

import {
  ArtifactKind,
  ChatVisibility,
  Prisma,
  type Chat as PrismaChat,
  type Document as PrismaDocument,
  type Message as PrismaMessage,
  type Suggestion as PrismaSuggestion,
  type Vote as PrismaVote,
} from '@prisma/client';

import type { VisibilityType } from '@/components/visibility-selector';
import type { AppUsage } from '@/lib/usage';
import { prisma } from './client';
import { ChatSDKError } from '../errors';
import { generateUUID } from '../utils';
import { generateHashedPassword } from './utils';
import type {
  DBChat,
  DBDocument,
  DBMessage,
  DBSuggestion,
  DBVote,
  DocumentKind,
} from './types';

function toVisibilityEnum(visibility: VisibilityType): ChatVisibility {
  return visibility === 'public' ? ChatVisibility.PUBLIC : ChatVisibility.PRIVATE;
}

function fromVisibilityEnum(visibility: ChatVisibility): VisibilityType {
  return visibility === ChatVisibility.PUBLIC ? 'public' : 'private';
}

function toArtifactKindEnum(kind: string): ArtifactKind {
  switch (kind) {
    case 'code':
      return ArtifactKind.CODE;
    case 'image':
      return ArtifactKind.IMAGE;
    case 'sheet':
      return ArtifactKind.SHEET;
    case 'text':
    default:
      return ArtifactKind.TEXT;
  }
}

function fromArtifactKindEnum(kind: ArtifactKind): DocumentKind {
  switch (kind) {
    case ArtifactKind.CODE:
      return 'code';
    case ArtifactKind.IMAGE:
      return 'image';
    case ArtifactKind.SHEET:
      return 'sheet';
    case ArtifactKind.TEXT:
    default:
      return 'text';
  }
}

function mapChat(chat: PrismaChat): DBChat {
  return {
    id: chat.id,
    createdAt: chat.createdAt,
    title: chat.title,
    userId: chat.userId,
    visibility: fromVisibilityEnum(chat.visibility),
    lastContext: (chat.lastContext as AppUsage | null) ?? null,
  };
}

function mapMessage(message: PrismaMessage): DBMessage {
  return {
    id: message.id,
    chatId: message.chatId,
    role: message.role,
    parts: message.parts as unknown,
    attachments: message.attachments as unknown,
    createdAt: message.createdAt,
  };
}

function mapDocument(document: PrismaDocument): DBDocument {
  return {
    id: document.id,
    createdAt: document.createdAt,
    title: document.title,
    content: document.content,
    kind: fromArtifactKindEnum(document.kind),
    userId: document.userId,
  };
}

function mapSuggestion(suggestion: PrismaSuggestion): DBSuggestion {
  return {
    id: suggestion.id,
    documentId: suggestion.documentId,
    documentCreatedAt: suggestion.documentCreatedAt,
    originalText: suggestion.originalText,
    suggestedText: suggestion.suggestedText,
    description: suggestion.description,
    isResolved: suggestion.isResolved,
    userId: suggestion.userId,
    createdAt: suggestion.createdAt,
  };
}

function mapVote(vote: PrismaVote): DBVote {
  return {
    chatId: vote.chatId,
    messageId: vote.messageId,
    isUpvoted: vote.isUpvoted,
    createdAt: vote.createdAt,
  };
}

export async function getUser(email: string) {
  try {
    return await prisma.user.findMany({ where: { email } });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get user by email');
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        userType: 'REGULAR',
      },
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to create user');
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    const user = await prisma.user.create({
      data: {
        email,
        password,
        userType: 'GUEST',
      },
      select: {
        id: true,
        email: true,
      },
    });

    return [user];
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create guest user',
    );
  }
}

export async function saveChat({
  id,
  userId,
  title,
  visibility,
}: {
  id: string;
  userId: string;
  title: string;
  visibility: VisibilityType;
}) {
  try {
    const chat = await prisma.chat.create({
      data: {
        id,
        userId,
        title,
        visibility: toVisibilityEnum(visibility),
      },
    });

    return mapChat(chat);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save chat');
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    const chat = await prisma.chat.delete({ where: { id } });
    return mapChat(chat);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete chat by id',
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
}) {
  try {
    const extendedLimit = limit + 1;

    const buildQuery = (createdAtFilter?: Prisma.DateTimeFilter) =>
      prisma.chat.findMany({
        where: {
          userId: id,
          ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: extendedLimit,
      });

    let filteredChats: PrismaChat[];

    if (startingAfter) {
      const anchor = await prisma.chat.findUnique({ where: { id: startingAfter } });

      if (!anchor) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${startingAfter} not found`,
        );
      }

      filteredChats = await buildQuery({ gt: anchor.createdAt });
    } else if (endingBefore) {
      const anchor = await prisma.chat.findUnique({ where: { id: endingBefore } });

      if (!anchor) {
        throw new ChatSDKError(
          'not_found:database',
          `Chat with id ${endingBefore} not found`,
        );
      }

      filteredChats = await buildQuery({ lt: anchor.createdAt });
    } else {
      filteredChats = await buildQuery();
    }

    const hasMore = filteredChats.length > limit;
    const chats = filteredChats
      .slice(0, hasMore ? limit : filteredChats.length)
      .map(mapChat);

    return {
      chats,
      hasMore,
    };
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }

    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get chats by user id',
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const chat = await prisma.chat.findUnique({ where: { id } });
    return chat ? mapChat(chat) : null;
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to get chat by id');
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    return await prisma.message.createMany({
      data: messages.map((message) => ({
        id: message.id,
        chatId: message.chatId,
        role: message.role,
        parts: message.parts as Prisma.InputJsonValue,
        attachments: message.attachments as Prisma.InputJsonValue,
        createdAt: message.createdAt,
      })),
    });
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save messages');
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    const messages = await prisma.message.findMany({
      where: { chatId: id },
      orderBy: { createdAt: 'asc' },
    });

    return messages.map(mapMessage);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get messages by chat id',
    );
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const vote = await prisma.vote.upsert({
      where: {
        chatId_messageId: { chatId, messageId },
      },
      update: { isUpvoted: type === 'up' },
      create: {
        chatId,
        messageId,
        isUpvoted: type === 'up',
      },
    });

    return mapVote(vote);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to vote message');
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    const votes = await prisma.vote.findMany({ where: { chatId: id } });
    return votes.map(mapVote);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get votes by chat id',
    );
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: DocumentKind;
  content: string;
  userId: string;
}) {
  try {
    const document = await prisma.document.create({
      data: {
        id,
        title,
        kind: toArtifactKindEnum(kind),
        content,
        userId,
      },
    });

    return mapDocument(document);
  } catch (error) {
    throw new ChatSDKError('bad_request:database', 'Failed to save document');
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await prisma.document.findMany({
      where: { id },
      orderBy: { createdAt: 'asc' },
    });

    return documents.map(mapDocument);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get documents by id',
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const document = await prisma.document.findFirst({
      where: { id },
      orderBy: { createdAt: 'desc' },
    });

    return document ? mapDocument(document) : null;
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get document by id',
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await prisma.suggestion.deleteMany({
      where: {
        documentId: id,
        documentCreatedAt: { gt: timestamp },
      },
    });

    return await prisma.document.deleteMany({
      where: {
        id,
        createdAt: { gt: timestamp },
      },
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete documents by id after timestamp',
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<DBSuggestion>;
}) {
  try {
    return await prisma.suggestion.createMany({
      data: suggestions,
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to save suggestions',
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    const suggestions = await prisma.suggestion.findMany({
      where: { documentId },
    });

    return suggestions.map(mapSuggestion);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get suggestions by document id',
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const messages = await prisma.message.findMany({ where: { id } });
    return messages.map(mapMessage);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message by id',
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await prisma.message.deleteMany({
      where: {
        chatId,
        createdAt: { gte: timestamp },
      },
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to delete messages by chat id after timestamp',
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        visibility: toVisibilityEnum(visibility),
      },
    });

    return mapChat(chat);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to update chat visibility by id',
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  context: AppUsage;
}) {
  try {
    const chat = await prisma.chat.update({
      where: { id: chatId },
      data: { lastContext: context as Prisma.InputJsonValue },
    });

    return mapChat(chat);
  } catch (error) {
    console.warn('Failed to update lastContext for chat', chatId, error);
    return null;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const since = new Date(Date.now() - differenceInHours * 60 * 60 * 1000);

    return await prisma.message.count({
      where: {
        chat: { userId: id },
        createdAt: { gte: since },
        role: 'user',
      },
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get message count by user id',
    );
  }
}

export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}) {
  try {
    await prisma.stream.create({
      data: { id: streamId, chatId },
    });
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to create stream id',
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await prisma.stream.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    return streamIds.map(({ id }) => id);
  } catch (error) {
    throw new ChatSDKError(
      'bad_request:database',
      'Failed to get stream ids by chat id',
    );
  }
}
