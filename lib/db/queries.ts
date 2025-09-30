import "server-only";

import { z } from "zod";
import { ChatSDKError } from "../errors";
import { generateUUID, getUnixTimestamp } from "../utils";
import {
  type Chat,
  type Message,
  type Document,
  type Suggestion,
  type AppUsage,
  type Stream,
  type User,
  type Vote,
  Visibility,
  DocumentKind,
  MessageRole,
  ResolutionStatus,
} from "./generated/stately_pb";
import { nodeTransport, SortDirection } from "@stately-cloud/client/node";
import { generateHashedPassword } from "./utils";
import { createClient } from "./generated";

// Import the Zod types directly
import type {
  User as ZodUser,
  Chat as ZodChat,
  Message as ZodMessage,
  Vote as ZodVote,
  Document as ZodDocument,
  Suggestion as ZodSuggestion,
  Stream as ZodStream,
  AppUsage as ZodAppUsage,
  MessagePart as ZodMessagePart,
  MessageAttachment as ZodMessageAttachment,
} from "./schema";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = createClient({
  storeId: 1833495932720661,
  transport: nodeTransport,
});

// ============================================
// Transformation Utilities
// ============================================

// Convert protobuf types to Zod types
function userToZod(user: User): ZodUser {
  return {
    id: user.id.toString(),
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: new Date(Number(user.createdAt) * 1000),
    lastModifiedAt: new Date(Number(user.lastModifiedAt) * 1000),
  };
}

function chatToZod(chat: Chat): ZodChat {
  return {
    id: chat.id.toString(),
    title: chat.title,
    userId: chat.userId.toString(),
    visibility: chat.visibility === Visibility.Visibility_PRIVATE ? "private" : "public",
    lastContext: chat.lastContext ? {
      app: chat.lastContext.app,
      version: chat.lastContext.version,
      features: chat.lastContext.features,
      metadata: chat.lastContext.metadata,
    } : undefined,
    createdAt: new Date(Number(chat.createdAt) * 1000),
    updatedAt: new Date(Number(chat.updatedAt) * 1000),
  };
}

function messageToZod(message: Message): ZodMessage {
  return {
    id: message.id.toString(),
    chatId: message.chatId.toString(),
    role: message.role === MessageRole.MessageRole_USER ? "user" :
          message.role === MessageRole.MessageRole_ASSISTANT ? "assistant" :
          message.role === MessageRole.MessageRole_SYSTEM ? "system" :
          "user",
    parts: message.parts.map(part => ({
      type: part.type,
      content: part.content,
      mimeType: part.mimeType,
      data: part.data as Uint8Array<ArrayBuffer>,
    })),
    attachments: message.attachments?.map(attachment => ({
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: attachment.size.toString(),
      url: attachment.url,
      data: attachment.data as Uint8Array<ArrayBuffer>,
    })),
    createdAt: new Date(Number(message.createdAt) * 1000),
    createdAtVersion: message.createdAtVersion.toString(),
  };
}

function voteToZod(vote: Vote): ZodVote {
  return {
    chatId: vote.chatId.toString(),
    messageId: vote.messageId.toString(),
    isUpvoted: vote.isUpvoted,
    votedAt: new Date(Number(vote.votedAt) * 1000),
  };
}

function documentToZod(document: Document): ZodDocument {
  return {
    id: document.id.toString(),
    userId: document.userId.toString(),
    title: document.title,
    content: document.content,
    kind: document.kind === DocumentKind.DocumentKind_TEXT ? "text" :
          document.kind === DocumentKind.DocumentKind_CODE ? "code" :
          document.kind === DocumentKind.DocumentKind_IMAGE ? "image" :
          document.kind === DocumentKind.DocumentKind_SHEET ? "sheet" :
          "text",
    createdAt: new Date(Number(document.createdAt) * 1000),
    updatedAt: new Date(Number(document.updatedAt) * 1000),
  };
}

function suggestionToZod(suggestion: Suggestion): ZodSuggestion {
  return {
    id: suggestion.id.toString(),
    documentId: suggestion.documentId.toString(),
    documentVersion: new Date(Number(suggestion.documentVersion) * 1000),
    originalText: suggestion.originalText,
    suggestedText: suggestion.suggestedText,
    description: suggestion.description,
    resolutionStatus: suggestion.resolutionStatus === ResolutionStatus.ResolutionStatus_PENDING ? "pending" :
                     suggestion.resolutionStatus === ResolutionStatus.ResolutionStatus_RESOLVED ? "resolved" :
                     suggestion.resolutionStatus === ResolutionStatus.ResolutionStatus_REJECTED ? "rejected" :
                     "pending",
    userId: suggestion.userId.toString(),
    resolvedAt: suggestion.resolvedAt ? new Date(Number(suggestion.resolvedAt) * 1000) : undefined,
  };
}

function streamToZod(stream: Stream): ZodStream {
  return {
    id: stream.id.toString(),
    chatId: stream.chatId.toString(),
    active: stream.active,
    createdAt: new Date(Number(stream.createdAt) * 1000),
    lastActivity: new Date(Number(stream.lastActivity) * 1000),
  };
}

export function zodToMessage(zodMessage: Omit<ZodMessage, "id" | "createdAt" | "createdAtVersion">): Message {
  return client.create("Message", {
    chatId: BigInt(zodMessage.chatId),
    role: zodMessage.role === "user" ? MessageRole.MessageRole_USER : 
          zodMessage.role === "assistant" ? MessageRole.MessageRole_ASSISTANT :
          zodMessage.role === "system" ? MessageRole.MessageRole_SYSTEM :
          MessageRole.MessageRole_USER,
    parts: zodMessage.parts.map(part => client.create("MessagePart", {
      type: part.type,
      content: part.content,
      mimeType: part.mimeType,
      data: part.data,
    })),
    attachments: zodMessage.attachments?.map(attachment => client.create("MessageAttachment", {
      name: attachment.name,
      mimeType: attachment.mimeType,
      size: BigInt(attachment.size),
      url: attachment.url,
      data: attachment.data,
    })),
  });
}

function zodToSuggestion(zodSuggestion: Omit<ZodSuggestion, "id" | "createdAt" | "documentCreatedAt">): Omit<Suggestion, 'resolvedAt'> {
  return client.create("Suggestion", {
    documentId: BigInt(zodSuggestion.documentId),
    documentVersion: BigInt(zodSuggestion.documentVersion.getTime()/1000),
    originalText: zodSuggestion.originalText,
    suggestedText: zodSuggestion.suggestedText,
    description: zodSuggestion.description,
    resolutionStatus: zodSuggestion.resolutionStatus === "pending" ? ResolutionStatus.ResolutionStatus_PENDING :
                     zodSuggestion.resolutionStatus === "resolved" ? ResolutionStatus.ResolutionStatus_RESOLVED :
                     zodSuggestion.resolutionStatus === "rejected" ? ResolutionStatus.ResolutionStatus_REJECTED :
                     ResolutionStatus.ResolutionStatus_PENDING,
    userId: BigInt(zodSuggestion.userId),
  });
}

export async function getUser(email: string): Promise<ZodUser> {
  // Validate input
  const validatedEmail = z.string().email().parse(email);
  
  try {
    const res = await client.get("User", `/user-${validatedEmail}`);
    if (!res) {
      throw new ChatSDKError("bad_request:database", "User not found");
    }
    return userToZod(res);
  } catch (_error) {
    console.error("Failed to get user by email", _error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(email: string, password: string): Promise<ZodUser> {
  // Validate input
  const validatedEmail = z.string().email().parse(email);
  const validatedPassword = z.string().min(1).parse(password);
  const hashedPassword = generateHashedPassword(validatedPassword);

  try {
    const user = await client.put(
      client.create("User", { 
        email: validatedEmail, 
        passwordHash: hashedPassword 
      })
    );
    return userToZod(user);
  } catch (_error) {
    console.error("Failed to create user", _error);
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser(): Promise<ZodUser> {
  const email = `guest-${Date.now()}@example.com`;
  const password = generateHashedPassword(generateUUID());

  try {
    const user = await client.put(
      client.create("User", { email, passwordHash: password })
    );
    return userToZod(user);
  } catch (_error) {
    console.error("Failed to create guest user", _error);
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
  visibility?: "private" | "public";
}): Promise<ZodChat> {
  // Validate input
  const validatedId = z.string().parse(id);
  const validatedUserId = z.string().parse(userId);
  const validatedTitle = z.string().parse(title);
  const validatedVisibility = visibility ? z.enum(["private", "public"]).parse(visibility) : undefined;

  try {
    const chat = await client.put(
      client.create("Chat", {
        id: BigInt(validatedId),
        userId: BigInt(validatedUserId),
        title: validatedTitle,
        visibility: validatedVisibility === "private" ? Visibility.Visibility_PRIVATE : Visibility.Visibility_PUBLIC,
      })
    );
    return chatToZod(chat);
  } catch (_error) {
    console.error("Failed to save chat", _error);
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }): Promise<void> {
  // Validate input
  const validatedId = z.string().parse(id);

  try {
    await client.transaction(async (tx) => {
      const iter = tx.beginList(`/chat-${validatedId}`);
      let keysToDelete: string[] = [];
      for await (const item of iter) {
        if (client.isType(item, "Message")) {
          keysToDelete.push(`/chat-${validatedId}/message-${item.id}`);
        }
        if (client.isType(item, "Vote")) {
          keysToDelete.push(`/chat-${validatedId}/message-${item.messageId}/vote`);
        }
      }
      await tx.del(...keysToDelete, `/chat-${validatedId}`);
    });
  } catch (_error) {
    console.error("Failed to delete chat by id", _error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete chat by id"
    );
  }
}

export async function getChatsByUserId({
  id,
  limit,
  token,
}: {
  id: string;
  limit: number;
  token: string | null;
}): Promise<{ chats: ZodChat[]; hasMore: boolean; token: string | null }> {
  // Validate input
  const validatedId = z.string().parse(id);
  const validatedLimit = limit ? z.number().int().positive().parse(limit) : 0;
  const validatedToken = token ? z.string().parse(token) : null;

  const tokenData = validatedToken ? Buffer.from(validatedToken, "base64") : null;

  try {
    let iter;
    if (tokenData) {
        iter = client.continueList(tokenData);
    } else {
        iter = client.beginList(`/user-${validatedId}/chat-`, { limit: validatedLimit });
    }
    let filteredChats: ZodChat[] = [];
    for await (const chat of iter) {
      if (client.isType(chat, "Chat")) {
        filteredChats.push(chatToZod(chat));
      }
    }

    return {
      chats: filteredChats,
      hasMore: iter.token!.canContinue,
      token: Buffer.from(iter.token!.tokenData).toString("base64"),
    };
  } catch (_error) {
    console.error("Failed to get chats by user id", _error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get chats by user id"
    );
  }
}

export async function getChatById({
  id,
}: {
  id: string;
}): Promise<ZodChat | undefined> {
  // Validate input
  const validatedId = z.string().parse(id);

  try {
    const chat = await client.get("Chat", `/chat-${validatedId}`);
    return chat ? chatToZod(chat) : undefined;
  } catch (_error) {
    console.error("Failed to get chat by id", _error);
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({ messages }: { messages: Omit<ZodMessage, "id" | "createdAt" | "createdAtVersion">[] }): Promise<void> {
  // Validate input - messages are already typed as ZodMessage[]
  const validatedMessages = messages;

  try {
    await client.putBatch(
      ...validatedMessages.map((message) => {
        return client.create("Message", {
          ...zodToMessage(message),
        });
      })
    );
  } catch (_error) {
    console.error("Failed to save messages", _error);
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({
  id,
}: {
  id: string;
}): Promise<{ messages: ZodMessage[]; hasMore: boolean }> {
  // Validate input
  const validatedId = z.string().parse(id);

  try {
    const iter = client.beginList(`/chat-${validatedId}/message-`);
    let filteredMessages: ZodMessage[] = [];
    for await (const message of iter) {
      if (client.isType(message, "Message")) {
        filteredMessages.push(messageToZod(message));
      }
    }

    return {
      messages: filteredMessages,
      hasMore: iter.token!.canContinue,
    };
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
}): Promise<ZodVote> {
  // Validate input
  const validatedChatId = z.string().parse(chatId);
  const validatedMessageId = z.string().parse(messageId);
  const validatedType = z.enum(["up", "down"]).parse(type);

  try {
    const vote = await client.put(
      client.create("Vote", {
        chatId: BigInt(validatedChatId),
        messageId: BigInt(validatedMessageId),
        isUpvoted: validatedType === "up",
      })
    );
    return voteToZod(vote);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

// TODO this should just be returned as part of listing over messages or even chat.
export async function getVotesByChatId({
  id,
}: {
  id: string;
}): Promise<ZodVote[]> {
  // Validate input
  const validatedId = z.string().parse(id);

  try {
    const iter = client.beginList(`/chat-${validatedId}`);
    let votes: ZodVote[] = [];
    for await (const vote of iter) {
      if (client.isType(vote, "Vote")) {
        votes.push(voteToZod(vote));
      }
    }

    return votes;
  } catch (_error) {
    console.error("Failed to get votes by chat id", _error);
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
  kind: "text" | "code" | "image" | "sheet";
  content: string;
  userId: string;
}): Promise<ZodDocument> {
  // Validate input
  const validatedId = z.string().parse(id);
  const validatedTitle = z.string().parse(title);
  const validatedKind = z.enum(["text", "code", "image", "sheet"]).parse(kind);
  const validatedContent = z.string().parse(content);
  const validatedUserId = z.string().parse(userId);

  try {
    const document = await client.put(
        client.create("Document", {
          id: BigInt(validatedId),
          title: validatedTitle,
          kind: validatedKind === "text" ? DocumentKind.DocumentKind_TEXT :
                validatedKind === "code" ? DocumentKind.DocumentKind_CODE :
                validatedKind === "image" ? DocumentKind.DocumentKind_IMAGE :
                validatedKind === "sheet" ? DocumentKind.DocumentKind_SHEET :
                DocumentKind.DocumentKind_TEXT,
          content: validatedContent,
          userId: BigInt(validatedUserId),
          createdAt: getUnixTimestamp(),
        })
    );
    return documentToZod(document);
  } catch (_error) {
    console.error("Failed to save document", _error);
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({ id }: { id: string }): Promise<ZodDocument[]> {
  // Validate input
  const validatedId = z.string().parse(id);

  try {
    const iter = client.beginList(`/document-${validatedId}/version-`);
    let documents: ZodDocument[] = [];
    for await (const document of iter) {
      if (client.isType(document, "Document")) {
        documents.push(documentToZod(document));
      }
    }

    return documents;
  } catch (_error) {
    console.error("Failed to get documents by id", _error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function getDocumentById({
  id,
}: {
  id: string;
}): Promise<ZodDocument | undefined> {
  // Validate input
  const validatedId = z.string().parse(id);

  try {
    const iter = client.beginList(`/document-${validatedId}/version-`, {sortDirection: SortDirection.SORT_DESCENDING, limit: 1});
    let documents: ZodDocument[] = [];
    for await (const document of iter) {
      if (client.isType(document, "Document")) {
        documents.push(documentToZod(document));
      }
    }
    return documents.at(0);
  } catch (_error) {
    console.error("Failed to get document by id", _error);
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
}): Promise<number> {
  // Validate input
  const validatedId = z.string().parse(id);
  const validatedTimestamp = z.date().parse(timestamp);

  try {
    // TODO delete suggestions too
    const resp = await client.transaction(async (tx) => {
      const kp = `/document-${validatedId}/version-`;
      const iter = tx.beginList(kp, {gt: kp + (validatedTimestamp.getTime() / 1000)});
      for await (const item of iter) {
        if (client.isType(item, "Document")) {
          await tx.del(kp + item.createdAt);
        }
        if (client.isType(item, "Suggestion")) {
          await tx.del(kp + `${item.documentVersion}/suggestion-${item.id}`);
        }
      }
    });
    return resp.puts.length;
  } catch (_error) {
    console.error("Failed to delete documents by id after timestamp", _error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents by id after timestamp"
    );
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Omit<ZodSuggestion, "id" | "createdAt" | "documentCreatedAt">[];
}): Promise<ZodSuggestion[]> {
  // Validate input
  const validatedSuggestions = suggestions;

  try {
    const suggestions = await client.putBatch(
      ...validatedSuggestions.map((suggestion) => {
        const protobufSuggestion = zodToSuggestion(suggestion);
        return client.create("Suggestion", {
          ...protobufSuggestion,
          resolvedAt: suggestion.resolvedAt ? BigInt(Math.floor(suggestion.resolvedAt.getTime() / 1000)) : BigInt(0),
        });
      })
    );
    return suggestions.map((suggestion) => suggestionToZod(suggestion));
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
}): Promise<ZodSuggestion[]> {
  // Validate input
  const validatedDocumentId = z.string().parse(documentId);

  try {
    const iter = client.beginList(`/document-${validatedDocumentId}/version-`);
    let suggestions: ZodSuggestion[] = [];
    for await (const suggestion of iter) {
      if (client.isType(suggestion, "Suggestion")) {
        suggestions.push(suggestionToZod(suggestion));
      }
    }
    return suggestions;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function getMessageById({ id }: { id: string }): Promise<ZodMessage> {
  // Validate input
  const validatedId = z.string().parse(id);

  try {
    const res = await client.get("Message", `/message-${validatedId}`);
    if (!res) {
      throw new ChatSDKError("bad_request:database", "Message not found");
    }
    return messageToZod(res);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message by id"
    );
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  messageId,
}: {
  chatId: string;
  messageId: string;
}): Promise<void> {
  // Validate input
  const validatedChatId = z.string().parse(chatId);
  const validatedMessageId = z.string().parse(messageId);

  try {
    // TODO add timestamp check
    await client.transaction(async (tx) => {
        const kp =`/chat-${validatedChatId}/message-`;
      const iter = tx.beginList(kp, {gte: kp + validatedMessageId});
      let keysToDelete: string[] = [];
      for await (const item of iter) {
        if (client.isType(item, "Message")) {
            keysToDelete.push(`/chat-${validatedChatId}/message-${item.id}`);
        }
        if (client.isType(item, "Vote")) {
            keysToDelete.push(`/chat-${validatedChatId}/message-${item.messageId}/vote`);
        }
      }
      await tx.del(...keysToDelete);
    });
  } catch (_error) {
    console.error("Failed to delete messages by chat id after timestamp", _error);
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
}): Promise<ZodChat> {
  // Validate input
  const validatedChatId = z.string().parse(chatId);
  const validatedVisibility = z.enum(["private", "public"]).parse(visibility);

  try {
    const res = await client.transaction(async (tx) => {
      const chat = await tx.get("Chat", `/chat-${validatedChatId}`);
      if (!chat) {
        throw new ChatSDKError("bad_request:database", "Chat not found");
      }
      chat.visibility =
        validatedVisibility === "private"
          ? Visibility.Visibility_PRIVATE
          : Visibility.Visibility_PUBLIC;
      await tx.put(chat);
    });
    return chatToZod(res.puts[0] as Chat);
  } catch (_error) {
    console.error("Failed to update chat visibility by id", _error);
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
  context: ZodAppUsage;
}): Promise<ZodChat> {
  // Validate input
  const validatedChatId = z.string().parse(chatId);
  const validatedContext = context;

  try {
    const res = await client.transaction(async (tx) => {
      const chat = await tx.get("Chat", `/chat-${validatedChatId}`);
      if (!chat) {
        throw new ChatSDKError("bad_request:database", "Chat not found");
      }
      chat.lastContext = client.create("AppUsage", {
        app: validatedContext.app,
        version: validatedContext.version,
        features: validatedContext.features,
        metadata: validatedContext.metadata,
      });
      await tx.put(chat);
    });
    return chatToZod(res.puts[0] as Chat);
  } catch (_error) {
    console.error("Failed to update chat last context by id", _error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat last context by id"
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}): Promise<{ count: number }> {
  // Validate input
  const validatedId = z.string().parse(id);
  const validatedDifferenceInHours = z.number().int().positive().parse(differenceInHours);

  try {
    // TODO implement stats on the chat level, this is just used for rate limiting.
    return { count: 10 };
  } catch (_error) {
    console.error("Failed to get message count by user id", _error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
    );
  }
}

export async function createStreamId({
  chatId,
}: {
  chatId: string;
}): Promise<void> {
  // Validate input
  const validatedChatId = z.string().parse(chatId);

  try {
    await client.put(
      client.create("Stream", {
        chatId: BigInt(validatedChatId),
      })
    );
  } catch (_error) {
    console.error("Failed to create stream id", _error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to create stream id"
    );
  }
}

export async function getStreamIdsByChatId({
  chatId,
}: {
  chatId: string;
}): Promise<ZodStream[]> {
  // Validate input
  const validatedChatId = z.string().parse(chatId);

  try {
    const iter = client.beginList(`/chat-${validatedChatId}/stream-`);
    let streams: ZodStream[] = [];
    for await (const stream of iter) {
      if (client.isType(stream, "Stream")) {
        streams.push(streamToZod(stream));
      }
    }

    return streams;
  } catch (_error) {
    console.error("Failed to get stream ids by chat id", _error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream ids by chat id"
    );
  }
}
