/** biome-ignore-all lint/style/useTrimStartEnd: <explanation> */
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
      query = query.where({
        createdAt: { $lt: (selectedChat as any).createdAt },
      });
    } else if (endingBefore) {
      // Find the chat to end before
      const selectedChat = await ChatModel.findOne({ id: endingBefore }).lean();
      if (!selectedChat) {
        throw new ChatSDKError(
          "not_found:database",
          `Chat with id ${endingBefore} not found`
        );
      }
      query = query.where({
        createdAt: { $gt: (selectedChat as any).createdAt },
      });
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
    const chat = (await ChatModel.findOne({
      id,
    }).lean()) as unknown as Chat | null;
    if (!chat) {
      return null;
    }

    return {
      id: chat.id,
      createdAt: chat.createdAt,
      title: chat.title,
      userId: chat.userId,
      visibility: chat.visibility,
      lastContext: chat.lastContext,
      updatedAt: chat.updatedAt,
    } as Chat;
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
    userId?: string;
  }>;
}): Promise<void> {
  try {
    await ensureConnection();
    
    // Use the existing message model directly (no versioning for new messages)
    for (const msg of messages) {
      await MessageModel.findOneAndUpdate(
        { id: msg.id },
        {
          chatId: msg.chatId,
          role: msg.role,
          parts: msg.parts,
          attachments: msg.attachments,
          createdAt: msg.createdAt,
          updatedAt: new Date(),
        },
        { upsert: true }
      );
    }
  } catch (error) {
    console.error("Failed to save messages:", error);
    console.error("Error details:", {
      name: (error as any)?.name,
      message: (error as any)?.message,
      stack: (error as any)?.stack,
    });
    throw new ChatSDKError("bad_request:database", `Failed to save messages: ${(error as any)?.message || 'Unknown error'}`);
  }
}

export async function getMessagesByChatId({
  id,
}: {
  id: string;
}): Promise<DBMessage[]> {
  try {
    await ensureConnection();
    
    // Use the existing versioning system to get current versions
    return await getMessagesWithCurrentVersions({ chatId: id });
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

export async function deleteMessagesByChatIdFromTimestamp({
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
      createdAt: { $gte: timestamp },
    });
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to delete messages from timestamp"
    );
  }
}

export async function updateMessageById({
  id,
  parts,
}: {
  id: string;
  parts: any;
}): Promise<void> {
  try {
    await ensureConnection();
    await MessageModel.findOneAndUpdate(
      { id },
      { parts, updatedAt: new Date() }
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to update message"
    );
  }
}

export async function saveOrUpdateMessage({
  chatId,
  id,
  role,
  parts,
  attachments,
  createdAt,
}: {
  chatId: string;
  id: string;
  role: string;
  parts: any;
  attachments: any;
  createdAt: Date;
}): Promise<void> {
  try {
    await ensureConnection();
    await MessageModel.findOneAndUpdate(
      { id },
      {
        chatId,
        role,
        parts,
        attachments,
        createdAt,
        updatedAt: new Date(),
      },
      { upsert: true }
    );
  } catch (_error) {
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to save or update message"
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
    const plainDoc = savedDoc.toObject();
    return [
      {
        _id: plainDoc._id.toString(),
        id: plainDoc.id,
        createdAt: plainDoc.createdAt,
        title: plainDoc.title,
        content: plainDoc.content,
        kind: plainDoc.kind,
        userId: plainDoc.userId,
      },
    ];
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
    return (documents as any[]).map((doc: any) => ({
      _id: doc._id?.toString?.() ?? String(doc._id ?? ""),
      id: doc.id,
      createdAt: doc.createdAt,
      title: doc.title,
      content: doc.content,
      kind: doc.kind,
      userId: doc.userId,
      updatedAt: doc.updatedAt,
    }));
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

export async function getDocumentById({
  id,
}: {
  id: string;
}): Promise<Document | null> {
  try {
    await ensureConnection();

    // Get the most recent document with the given ID
    const selectedDocument = await DocumentModel.findOne({ id })
      .sort({ createdAt: -1 })
      .lean();

    if (!selectedDocument) {
      return null;
    }

    const doc: any = selectedDocument;

    return {
      _id: doc._id?.toString?.() ?? String(doc._id ?? ""),
      id: doc.id,
      createdAt: doc.createdAt,
      title: doc.title,
      content: doc.content,
      kind: doc.kind,
      userId: doc.userId,
      updatedAt: doc.updatedAt,
    } as unknown as Document;
  } catch (error) {
    console.error("Failed to get document by id:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get document by id"
    );
  }
}

// Message Versioning Functions

export async function createMessageVersion({
  originalMessageId,
  newMessageId,
  chatId,
  role,
  parts,
  attachments,
  userId,
}: {
  originalMessageId: string;
  newMessageId: string;
  chatId: string;
  role: string;
  parts: any;
  attachments: any;
  userId: string;
}): Promise<DBMessage> {
  try {
    await ensureConnection();

    console.log("Creating message version for:", originalMessageId);

    // Get the original message to find its version group
    const originalMessage = await MessageModel.findOne({ id: originalMessageId });
    
    if (!originalMessage) {
      console.error("Original message not found:", originalMessageId);
      throw new ChatSDKError(
        "bad_request:database",
        `Original message not found: ${originalMessageId}`
      );
    }

    console.log("Found original message:", originalMessage.id, "versionGroupId:", originalMessage.versionGroupId);

    // Use existing versionGroupId or create new one if original doesn't have versioning
    const versionGroupId = originalMessage.versionGroupId || originalMessage.id;
    console.log("Using versionGroupId:", versionGroupId);
    
    // Get the highest version number for this group
    const lastVersion = await MessageModel.findOne({ versionGroupId })
      .sort({ versionNumber: -1 })
      .lean() as any;
    
    console.log("Last version found:", lastVersion?.versionNumber);
    const newVersionNumber = (lastVersion?.versionNumber || 0) + 1;
    console.log("New version number:", newVersionNumber);

    // Mark all existing versions as not current
    const updateResult = await MessageModel.updateMany(
      { versionGroupId },
      { isCurrentVersion: false }
    );
    console.log("Updated existing versions:", updateResult.modifiedCount);

    // If original message doesn't have versioning, update it
    if (!originalMessage.versionGroupId) {
      const originalContent = originalMessage.latestContent || originalMessage.parts;
      const originalUpdateResult = await MessageModel.updateOne(
        { id: originalMessageId },
        {
          versionGroupId,
          versionNumber: 1,
          isCurrentVersion: false,
          // Ensure required fields are set
          userId: originalMessage.userId || userId, // Use existing or provided userId
          latestContent: originalContent, // Use existing or parts
          latestPlainText: originalMessage.latestPlainText || extractPlainText(originalContent), // Extract if missing
        }
      );
      console.log("Updated original message with versioning:", originalUpdateResult.modifiedCount);
    }

    // Extract plain text from parts for search
    const extractPlainText = (parts: any): string => {
      if (!parts) return "";
      if (Array.isArray(parts)) {
        return parts
          .filter(part => part.type === "text")
          .map(part => part.text || "")
          .join(" ")
          .trim();
      }
      if (typeof parts === "string") return parts;
      return "";
    };

    // Create the new version
    const newMessage = new MessageModel({
      id: newMessageId,
      chatId,
      userId, // Add required userId field
      role,
      parts,
      latestContent: parts, // Add required latestContent field
      latestPlainText: extractPlainText(parts), // Extract plain text for search
      attachments,
      createdAt: new Date(),
      versionGroupId,
      versionNumber: newVersionNumber,
      isCurrentVersion: true,
      parentVersionId: originalMessageId,
    });

    console.log("Saving new message version:", newMessageId);
    const savedMessage = await newMessage.save();
    console.log("Successfully saved new message version");

    return {
      _id: savedMessage._id?.toString?.() ?? String(savedMessage._id ?? ""),
      id: savedMessage.id,
      chatId: savedMessage.chatId,
      role: savedMessage.role,
      parts: savedMessage.parts,
      attachments: savedMessage.attachments,
      createdAt: savedMessage.createdAt,
      updatedAt: savedMessage.updatedAt,
      versionGroupId: savedMessage.versionGroupId,
      versionNumber: savedMessage.versionNumber,
      isCurrentVersion: savedMessage.isCurrentVersion,
      parentVersionId: savedMessage.parentVersionId,
    } as unknown as DBMessage;
  } catch (error) {
    console.error("Failed to create message version:", error);
    if (error instanceof ChatSDKError) {
      throw error;
    }
    throw new ChatSDKError(
      "bad_request:database",
      `Failed to create message version: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function getMessageVersions({
  versionGroupId,
}: {
  versionGroupId: string;
}): Promise<DBMessage[]> {
  try {
    await ensureConnection();

    const versions = await MessageModel.find({ versionGroupId })
      .sort({ versionNumber: 1 })
      .lean();

    return versions.map((message: any) => ({
      _id: message._id?.toString?.() ?? String(message._id ?? ""),
      id: message.id,
      chatId: message.chatId,
      role: message.role,
      parts: message.parts,
      attachments: message.attachments,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      versionGroupId: message.versionGroupId,
      versionNumber: message.versionNumber,
      isCurrentVersion: message.isCurrentVersion,
      parentVersionId: message.parentVersionId,
    })) as unknown as DBMessage[];
  } catch (error) {
    console.error("Failed to get message versions:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get message versions"
    );
  }
}

export async function switchToMessageVersion({
  versionGroupId,
  targetVersionNumber,
}: {
  versionGroupId: string;
  targetVersionNumber: number;
}): Promise<DBMessage | null> {
  try {
    await ensureConnection();

    // Mark all versions as not current
    await MessageModel.updateMany(
      { versionGroupId },
      { isCurrentVersion: false }
    );

    // Mark target version as current
    const updatedMessage = await MessageModel.findOneAndUpdate(
      { versionGroupId, versionNumber: targetVersionNumber },
      { isCurrentVersion: true },
      { new: true }
    );

    if (!updatedMessage) {
      return null;
    }

    return {
      _id: updatedMessage._id?.toString?.() ?? String(updatedMessage._id ?? ""),
      id: updatedMessage.id,
      chatId: updatedMessage.chatId,
      role: updatedMessage.role,
      parts: updatedMessage.parts,
      attachments: updatedMessage.attachments,
      createdAt: updatedMessage.createdAt,
      updatedAt: updatedMessage.updatedAt,
      versionGroupId: updatedMessage.versionGroupId,
      versionNumber: updatedMessage.versionNumber,
      isCurrentVersion: updatedMessage.isCurrentVersion,
      parentVersionId: updatedMessage.parentVersionId,
    } as unknown as DBMessage;
  } catch (error) {
    console.error("Failed to switch message version:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to switch message version"
    );
  }
}

export async function getMessagesWithCurrentVersions({
  chatId,
}: {
  chatId: string;
}): Promise<DBMessage[]> {
  try {
    await ensureConnection();

    // Get all messages that are either:
    // 1. Current versions (isCurrentVersion: true)
    // 2. Don't have versioning (versionGroupId is null/undefined)
    const messages = await MessageModel.find({
      chatId,
      $or: [
        { isCurrentVersion: true },
        { versionGroupId: { $exists: false } },
        { versionGroupId: null }
      ]
    })
      .sort({ createdAt: 1 })
      .lean();

    return messages.map((message: any) => ({
      _id: message._id?.toString?.() ?? String(message._id ?? ""),
      id: message.id,
      chatId: message.chatId,
      role: message.role,
      parts: message.parts,
      attachments: message.attachments,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      versionGroupId: message.versionGroupId,
      versionNumber: message.versionNumber,
      isCurrentVersion: message.isCurrentVersion,
      parentVersionId: message.parentVersionId,
    })) as unknown as DBMessage[];
  } catch (error) {
    console.error("Failed to get messages with current versions:", error);
    throw new ChatSDKError(
      "bad_request:database",
      "Failed to get messages with current versions"
    );
  }
}
