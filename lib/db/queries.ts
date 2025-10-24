/** biome-ignore-all lint/correctness/noUnusedImports: <explanation> */
import "server-only";

import type { ArtifactKind } from "@/components/artifact";
import type { VisibilityType } from "@/components/visibility-selector";
import { ChatSDKError } from "../errors";
import type { AppUsage } from "../usage";
import { generateUUID } from "../utils";
import {
  type Chat,
  ChatModel,
  type DBMessage,
  type Document,
  DocumentModel,
  MessageModel,
  type Stream,
  StreamModel,
  type Suggestion,
  SuggestionModel,
  type User,
  UserModel,
  type Vote,
  VoteModel,
} from "./models";
import connectDB from "./mongodb";
import { generateHashedPassword } from "./utils";

// Ensure database connection
async function ensureConnection() {
  await connectDB();
}

export async function getUser(email: string): Promise<User[]> {
  try {
    await ensureConnection();
    const users = await UserModel.find({ email }).lean();
    return users as unknown as User[];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get user by email"
    );
  }
}

export async function createUser(
  email: string,
  password: string
): Promise<User[]> {
  try {
    await ensureConnection();
    const hashedPassword = await generateHashedPassword(password);
    const id = generateUUID();

    const newUser = new UserModel({
      id,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    const savedUser = await newUser.save();
    return [savedUser.toObject() as User];
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to create user");
  }
}

export async function createGuestUser(): Promise<User[]> {
  try {
    await ensureConnection();
    const id = generateUUID();
    const email = `guest-${Date.now()}`;

    const newUser = new UserModel({
      id,
      email,
      createdAt: new Date(),
    });

    const savedUser = await newUser.save();
    return [savedUser.toObject() as User];
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
  visibility = "private",
}: {
  id: string;
  userId: string;
  title: string;
  visibility?: VisibilityType;
}): Promise<void> {
  try {
    await ensureConnection();
    const newChat = new ChatModel({
      id,
      userId,
      title,
      visibility,
      createdAt: new Date(),
    });

    await newChat.save();
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save chat");
  }
}

export async function deleteChatById({ id }: { id: string }): Promise<void> {
  try {
    await ensureConnection();
    await ChatModel.deleteOne({ id });
    await MessageModel.deleteMany({ chatId: id });
    await VoteModel.deleteMany({ chatId: id });
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to delete chat");
  }
}

export async function getChatsByUserId({
  id,
  limit = 10,
  startingAfter,
  endingBefore,
}: {
  id: string;
  limit?: number;
  startingAfter?: string | null;
  endingBefore?: string | null;
}): Promise<{ chats: Chat[]; hasMore: boolean }> {
  try {
    await ensureConnection();

    let query = ChatModel.find({ userId: id });

    if (startingAfter) {
      // Find the chat to start after
      const selectedChat = await ChatModel.findOne({
        id: startingAfter,
      }).lean();
      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${startingAfter} not found`
        );
      }
      query = query.where({ createdAt: { $lt: selectedChat.createdAt } });
    } else if (endingBefore) {
      // Find the chat to end before
      const selectedChat = await ChatModel.findOne({ id: endingBefore }).lean();
      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }
      query = query.where({ createdAt: { $gt: selectedChat.createdAt } });
    }

    const chats = await query
      .sort({ createdAt: -1 })
      .limit(limit + 1) // Fetch one extra to check if there are more
      .lean();

    // Check if there are more chats beyond the requested limit
    const hasMore = chats.length > limit;

    // Return only the requested number of chats (the extra one is for pagination info)
    const result = hasMore ? chats.slice(0, limit) : chats;

    return {
      chats: result as unknown as Chat[],
      hasMore,
    };
  } catch (error) {
    if (error instanceof ChatSDKError) {
      throw error;
    }
    console.error("Failed to get chats by user id:", error);
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
}): Promise<Chat | null> {
  try {
    await ensureConnection();
    const chat = await ChatModel.findOne({ id }).lean();
    return chat as unknown as Chat | null;
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to get chat by id");
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<{
    chatId: string;
    id: string;
    role: string;
    parts: any;
    attachments: any;
    createdAt: Date;
  }>;
}): Promise<void> {
  try {
    await ensureConnection();
    const messageDocuments = messages.map((msg) => new MessageModel(msg));
    await MessageModel.insertMany(messageDocuments);
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save messages");
  }
}

export async function getMessagesByChatId({
  id,
}: {
  id: string;
}): Promise<DBMessage[]> {
  try {
    await ensureConnection();
    const messages = await MessageModel.find({ chatId: id })
      .sort({ createdAt: 1 })
      .lean();
    return messages as unknown as DBMessage[];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages by chat id"
    );
  }
}

export async function getMessageById({
  id,
}: {
  id: string;
}): Promise<DBMessage[]> {
  try {
    await ensureConnection();
    const message = await MessageModel.findOne({ id }).lean();
    return message ? [message as unknown as DBMessage] : [];
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
}): Promise<void> {
  try {
    await ensureConnection();
    await MessageModel.deleteMany({
      chatId,
      createdAt: { $gt: timestamp },
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages after timestamp"
    );
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}): Promise<number> {
  try {
    await ensureConnection();
    const since = new Date(Date.now() - differenceInHours * 60 * 60 * 1000);

    // Get all chats for the user
    const userChats = await ChatModel.find({ userId: id }).select("id").lean();
    const chatIds = userChats.map((chat) => chat.id);

    // Count messages in those chats since the timestamp
    const count = await MessageModel.countDocuments({
      chatId: { $in: chatIds },
      createdAt: { $gte: since },
    });

    return count;
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message count by user id"
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
}): Promise<void> {
  try {
    await ensureConnection();
    await VoteModel.findOneAndUpdate(
      { chatId, messageId },
      { isUpvoted: type === "up" },
      { upsert: true }
    );
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to vote message");
  }
}

export async function getVotesByChatId({
  id,
}: {
  id: string;
}): Promise<Vote[]> {
  try {
    await ensureConnection();
    const votes = await VoteModel.find({ chatId: id }).lean();
    return votes as unknown as Vote[];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get votes by chat id"
    );
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}): Promise<void> {
  try {
    await ensureConnection();
    await ChatModel.findOneAndUpdate({ id: chatId }, { visibility });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat visibility"
    );
  }
}

export async function updateChatLastContextById({
  chatId,
  context,
}: {
  chatId: string;
  context: AppUsage;
}): Promise<void> {
  try {
    await ensureConnection();
    await ChatModel.findOneAndUpdate({ id: chatId }, { lastContext: context });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update chat last context"
    );
  }
}

// Document-related functions
export async function saveDocument({
  id,
  title,
  content,
  userId,
  kind = "text",
}: {
  id: string;
  title: string;
  content?: string;
  userId: string;
  kind?: ArtifactKind;
}): Promise<Document[]> {
  try {
    await ensureConnection();
    const now = new Date();
    const newDocument = new DocumentModel({
      id,
      title,
      content,
      userId,
      kind,
      createdAt: now,
    });

    const savedDoc = await newDocument.save();
    return [savedDoc.toObject() as Document];
  } catch (_error) {
    throw new ChatSDKError("bad_request:database", "Failed to save document");
  }
}

export async function getDocumentsById({
  id,
}: {
  id: string;
}): Promise<Document[]> {
  try {
    await ensureConnection();
    const documents = await DocumentModel.find({ id })
      .sort({ createdAt: -1 })
      .lean();
    return documents as unknown as Document[];
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get documents by id"
    );
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}): Promise<void> {
  try {
    await ensureConnection();
    await DocumentModel.deleteMany({
      id,
      createdAt: { $gt: timestamp },
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete documents after timestamp"
    );
  }
}

// Stream-related functions
export async function createStreamId({
  streamId,
  chatId,
}: {
  streamId: string;
  chatId: string;
}): Promise<void> {
  try {
    await ensureConnection();
    const newStream = new StreamModel({
      id: streamId,
      chatId,
      createdAt: new Date(),
    });

    await newStream.save();
  } catch (_error) {
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
}): Promise<string[]> {
  try {
    await ensureConnection();
    const streams = await StreamModel.find({ chatId })
      .sort({ createdAt: 1 })
      .select("id")
      .lean();

    return streams.map((stream) => stream.id);
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get stream IDs by chat ID"
    );
  }
}

// Suggestion-related functions (keeping for compatibility)
export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<{
    id: string;
    documentId: string;
    documentCreatedAt: Date;
    originalText: string;
    suggestedText: string;
    description?: string;
    userId: string;
  }>;
}): Promise<Suggestion[]> {
  try {
    await ensureConnection();
    const now = new Date();
    const suggestionDocs = suggestions.map(
      (s) =>
        new SuggestionModel({
          ...s,
          createdAt: now,
          isResolved: false,
        })
    );

    const savedSuggestions = await SuggestionModel.insertMany(suggestionDocs);
    return savedSuggestions.map((s) => s.toObject() as Suggestion);
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
    await ensureConnection();
    return await SuggestionModel.find({ documentId }).lean();
  } catch (error) {
    console.error("Failed to get suggestions by document id:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get suggestions by document id"
    );
  }
}

export async function deleteAllChatsByUserId({ userId }: { userId: string }) {
  try {
    await ensureConnection();

    // Find all chats for the user
    const userChats = await ChatModel.find({ userId }).select("id").lean();

    if (userChats.length === 0) {
      return { deletedCount: 0 };
    }

    const chatIds = userChats.map((c) => c.id);

    // Delete associated votes, messages, and streams
    await VoteModel.deleteMany({ chatId: { $in: chatIds } });
    await MessageModel.deleteMany({ chatId: { $in: chatIds } });
    await StreamModel.deleteMany({ chatId: { $in: chatIds } });

    // Delete the chats
    const deletedChats = await ChatModel.deleteMany({ userId });

    return { deletedCount: deletedChats.deletedCount || 0 };
  } catch (error) {
    console.error("Failed to delete all chats by user id:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete all chats by user id"
    );
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    await ensureConnection();

    // Get the most recent document with the given ID
    const selectedDocument = await DocumentModel.findOne({ id })
      .sort({ createdAt: -1 })
      .lean();

    return selectedDocument;
  } catch (error) {
    console.error("Failed to get document by id:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}
