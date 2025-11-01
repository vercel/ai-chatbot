import "server-only";

import { type Prisma, PrismaClient } from "@/generated/client";
import { subHours } from "date-fns";
import { nanoid } from "nanoid";
import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import type {
  Chat,
  Document,
  Message_v2,
  Suggestion,
  User,
  Vote_v2,
} from "@/generated/client";
import { ChatSDKError } from "../errors";
import type { AppUsage } from "../usage";
import { generateHashedPassword } from "./utils";

// Re-export types from Prisma Client
export type { User, Chat, Document, Suggestion };
export type Vote = Vote_v2;
export type DBMessage = Message_v2;
export type DBMessageInput = Prisma.Message_v2CreateManyInput;
export type SuggestionInput = Prisma.SuggestionCreateManyInput;

// Optionally, if not using email/pass login, you can
// use the Prisma adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/prisma

const prisma = new PrismaClient();

export async function getUser(email: string): Promise<User[]> {
  try {
    const user = await prisma.user.findMany({
      where: { email },
    });
    return user;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await prisma.user.create({
      data: { email, password: hashedPassword },
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(nanoid());

  try {
    return await prisma.user.create({
      data: { email, password },
      select: {
        id: true,
        email: true,
      },
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create guest user"
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
    return await prisma.chat.create({
      data: {
        id,
        createdAt: new Date(),
        userId,
        title,
        visibility,
      },
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await prisma.vote_v2.deleteMany({ where: { chatId: id } });
    await prisma.message_v2.deleteMany({ where: { chatId: id } });
    await prisma.stream.deleteMany({ where: { chatId: id } });

    const chatsDeleted = await prisma.chat.delete({
      where: { id },
    });
    return chatsDeleted;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    const userChats = await prisma.chat.findMany({
      where: { userId },
      select: { id: true },
    });

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);

    await prisma.vote_v2.deleteMany({ where: { chatId: { in: chatIds } } });
    await prisma.message_v2.deleteMany({ where: { chatId: { in: chatIds } } });
    await prisma.stream.deleteMany({ where: { chatId: { in: chatIds } } });

    const deletedChats = await prisma.chat.deleteMany({
      where: { userId },
    });

    return { deletedCount: deletedChats.count };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete all chats by user id"
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

    let whereCondition: any = { userId: id };

    if (startingAfter) {
      const selectedChat = await prisma.chat.findUnique({
        where: { id: startingAfter },
      });

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }

      whereCondition = {
        userId: id,
        createdAt: { gt: selectedChat.createdAt },
      };
    } else if (endingBefore) {
      const selectedChat = await prisma.chat.findUnique({
        where: { id: endingBefore },
      });

      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }

      whereCondition = {
        userId: id,
        createdAt: { lt: selectedChat.createdAt },
      };
    }

    const filteredChats = await prisma.chat.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      take: extendedLimit,
    });

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const selectedChat = await prisma.chat.findUnique({
      where: { id },
    });

    if (!selectedChat) {
      return null;
    }

    return selectedChat;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({
  messages,
}: {
  messages: DBMessageInput[];
}) {
  try {
    return await prisma.message_v2.createMany({
      data: messages,
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await prisma.message_v2.findMany({
      where: { chatId: id },
      orderBy: { createdAt: "asc" },
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
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
  type: "up" | "down";
}) {
  try {
    const existingVote = await prisma.vote_v2.findUnique({
      where: {
        chatId_messageId: {
          chatId,
          messageId,
        },
      },
    });

    if (existingVote) {
      return await prisma.vote_v2.update({
        where: {
          chatId_messageId: {
            chatId,
            messageId,
          },
        },
        data: { isUpvoted: type === "up" },
      });
    }

    return await prisma.vote_v2.create({
      data: {
        chatId,
        messageId,
        isUpvoted: type === "up",
      },
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await prisma.vote_v2.findMany({
      where: { chatId: id },
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id"
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
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await prisma.document.create({
      data: {
        id,
        title,
        text: kind,
        content,
        userId,
        createdAt: new Date(),
      },
    });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await prisma.document.findMany({
      where: { id },
      orderBy: { createdAt: "asc" },
    });

    return documents;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const selectedDocument = await prisma.document.findFirst({
      where: { id },
      orderBy: { createdAt: "desc" },
    });

    return selectedDocument;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
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

    // First get the documents to return
    const documentsToDelete = await prisma.document.findMany({
      where: {
        id,
        createdAt: { gt: timestamp },
      },
    });

    // Then delete them
    await prisma.document.deleteMany({
      where: {
        id,
        createdAt: { gt: timestamp },
      },
    });

    return documentsToDelete;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: SuggestionInput[];
}) {
  try {
    return await prisma.suggestion.createMany({
      data: suggestions,
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save suggestions"
    );
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await prisma.suggestion.findMany({
      where: { documentId },
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await prisma.message_v2.findMany({
      where: { id },
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
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
    const messagesToDelete = await prisma.message_v2.findMany({
      where: {
        chatId,
        createdAt: { gte: timestamp },
      },
      select: { id: true },
    });

    const messageIds = messagesToDelete.map(
      (currentMessage) => currentMessage.id
    );

    if (messageIds.length > 0) {
      await prisma.vote_v2.deleteMany({
        where: {
          chatId,
          messageId: { in: messageIds },
        },
      });

      return await prisma.message_v2.deleteMany({
        where: {
          chatId,
          id: { in: messageIds },
        },
      });
    }
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages by chat id after timestamp"
    );
  }
}

export async function updateChatVisibilityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: "private" | "public";
}) {
  try {
    return await prisma.chat.update({
      where: { id: chatId },
      data: { visibility },
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility by id"
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  // Store merged server-enriched usage object
  context: AppUsage;
}) {
  try {
    return await prisma.chat.update({
      where: { id: chatId },
      data: { lastContext: context },
    });
  } catch (error) {
    console.warn("Failed to update lastContext for chat", chatId, error);
    return;
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
    const twentyFourHoursAgo = subHours(new Date(), differenceInHours);

    const count = await prisma.message_v2.count({
      where: {
        Chat: {
          userId: id,
        },
        createdAt: { gte: twentyFourHoursAgo },
        role: "user",
      },
    });

    return count;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
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
      data: { id: streamId, chatId, createdAt: new Date() },
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({ chatId }: { chatId: string }) {
  try {
    const streamIds = await prisma.stream.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    return streamIds.map(({ id }) => id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}
