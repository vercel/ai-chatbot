import { MessageModel, MessageVersionModel } from "./models";
import type { DBMessage, MessageVersion } from "./schema";
import { ChatSDKError } from "../errors";

// Ensure database connection
async function ensureConnection() {
  // This is a simplified version - in production you'd want proper connection management
  // For now, we rely on Mongoose's built-in connection handling
}

/**
 * Extract plain text from message parts for search indexing
 */
function extractPlainText(parts: any[]): string {
  if (!Array.isArray(parts)) return "";
  
  return parts
    .filter(part => part.type === "text")
    .map(part => part.text || "")
    .join(" ")
    .trim();
}

/**
 * Create a new message with version 1
 */
export async function createMessage({
  id,
  chatId,
  userId,
  role,
  content,
  attachments = [],
}: {
  id: string;
  chatId: string;
  userId: string;
  role: string;
  content: any;
  attachments?: any[];
}): Promise<{ message: DBMessage; version: MessageVersion }> {
  try {
    await ensureConnection();

    const plainText = extractPlainText(content);
    const now = new Date();

    // Start transaction
    const session = await MessageModel.startSession();
    let message: DBMessage;
    let version: MessageVersion;

    await session.withTransaction(async () => {
      // 1. Create the message (denormalized)
      const messageDoc = await MessageModel.create([{
        id,
        chatId,
        userId,
        role,
        latestVersionId: null, // Will be set after version creation
        latestContent: content,
        latestPlainText: plainText,
        attachments,
        createdAt: now,
      }], { session });

      // 2. Create version 1
      const versionDoc = await MessageVersionModel.create([{
        messageId: id,
        versionNumber: 1,
        authorId: userId,
        content,
        plainText,
        editReason: "Initial message",
        createdAt: now,
      }], { session });

      // 3. Update message with latest version ID
      await MessageModel.updateOne(
        { id },
        { latestVersionId: versionDoc[0]._id.toString() },
        { session }
      );

      // Convert to plain objects
      message = {
        _id: messageDoc[0]._id.toString(),
        id: messageDoc[0].id,
        chatId: messageDoc[0].chatId,
        userId: messageDoc[0].userId,
        role: messageDoc[0].role,
        latestVersionId: versionDoc[0]._id.toString(),
        latestContent: messageDoc[0].latestContent,
        latestPlainText: messageDoc[0].latestPlainText,
        attachments: messageDoc[0].attachments,
        createdAt: messageDoc[0].createdAt,
        updatedAt: messageDoc[0].updatedAt,
      };

      version = {
        _id: versionDoc[0]._id.toString(),
        messageId: versionDoc[0].messageId,
        versionNumber: versionDoc[0].versionNumber,
        authorId: versionDoc[0].authorId,
        content: versionDoc[0].content,
        plainText: versionDoc[0].plainText,
        editReason: versionDoc[0].editReason,
        metadata: versionDoc[0].metadata,
        createdAt: versionDoc[0].createdAt,
      };
    });

    await session.endSession();

    return { message: message!, version: version! };
  } catch (error) {
    console.error("Failed to create message:", error);
    console.error("Message creation error details:", {
      name: (error as any)?.name,
      message: (error as any)?.message,
      stack: (error as any)?.stack,
    });
    throw new ChatSDKError("bad_request:database", `Failed to create message: ${(error as any)?.message || 'Unknown error'}`);
  }
}

/**
 * Edit a message (create new version with optimistic concurrency)
 */
export async function editMessage({
  messageId,
  authorId,
  newContent,
  editReason,
  clientLatestVersion,
}: {
  messageId: string;
  authorId: string;
  newContent: any;
  editReason?: string;
  clientLatestVersion?: number;
}): Promise<{ message: DBMessage; version: MessageVersion; conflict?: boolean }> {
  try {
    await ensureConnection();

    const plainText = extractPlainText(newContent);
    const now = new Date();

    // Start transaction
    const session = await MessageModel.startSession();
    let result: { message: DBMessage; version: MessageVersion; conflict?: boolean };

    await session.withTransaction(async () => {
      // 1. Get current message and latest version
      const currentMessage = await MessageModel.findOne({ id: messageId }).session(session);
      if (!currentMessage) {
        throw new ChatSDKError("not_found:database", "Message not found");
      }

      // 2. Get latest version number for optimistic concurrency check
      const latestVersion = await MessageVersionModel
        .findOne({ messageId })
        .sort({ versionNumber: -1 })
        .session(session);

      const currentVersionNumber = latestVersion?.versionNumber || 0;

      // 3. Check for conflicts
      if (clientLatestVersion && clientLatestVersion !== currentVersionNumber) {
        result = {
          message: currentMessage.toObject() as DBMessage,
          version: latestVersion?.toObject() as MessageVersion,
          conflict: true
        };
        return;
      }

      // 4. Create new version
      const newVersionNumber = currentVersionNumber + 1;
      const versionDoc = await MessageVersionModel.create([{
        messageId,
        versionNumber: newVersionNumber,
        authorId,
        content: newContent,
        plainText,
        editReason: editReason || `Edit ${newVersionNumber}`,
        createdAt: now,
      }], { session });

      // 5. Update denormalized message
      const updatedMessage = await MessageModel.findOneAndUpdate(
        { id: messageId },
        {
          latestVersionId: versionDoc[0]._id.toString(),
          latestContent: newContent,
          latestPlainText: plainText,
          updatedAt: now,
        },
        { new: true, session }
      );

      if (!updatedMessage) {
        throw new ChatSDKError("not_found:database", "Message not found");
      }

      // Convert to plain objects with proper serialization
      const messageObj = updatedMessage.toObject();
      const versionObj = versionDoc[0].toObject();
      
      result = {
        message: {
          _id: messageObj._id?.toString() || "",
          id: messageObj.id,
          chatId: messageObj.chatId,
          userId: messageObj.userId,
          role: messageObj.role,
          latestVersionId: messageObj.latestVersionId,
          latestContent: messageObj.latestContent,
          latestPlainText: messageObj.latestPlainText,
          attachments: messageObj.attachments,
          createdAt: messageObj.createdAt,
          updatedAt: messageObj.updatedAt,
        } as DBMessage,
        version: {
          _id: versionObj._id?.toString() || "",
          messageId: versionObj.messageId,
          versionNumber: versionObj.versionNumber,
          authorId: versionObj.authorId,
          content: versionObj.content,
          plainText: versionObj.plainText,
          editReason: versionObj.editReason,
          metadata: versionObj.metadata,
          createdAt: versionObj.createdAt,
        } as MessageVersion,
        conflict: false
      };
    });

    await session.endSession();

    return result!;
  } catch (error) {
    console.error("Failed to edit message:", error);
    throw new ChatSDKError("bad_request:database", "Failed to edit message");
  }
}

/**
 * Get all versions of a message
 */
export async function getMessageVersions({
  messageId,
  limit = 50,
  offset = 0,
}: {
  messageId: string;
  limit?: number;
  offset?: number;
}): Promise<MessageVersion[]> {
  try {
    await ensureConnection();

    const versions = await MessageVersionModel
      .find({ messageId })
      .sort({ versionNumber: -1 }) // Latest first
      .limit(limit)
      .skip(offset)
      .lean();

    return versions.map((version: any) => ({
      _id: version._id?.toString() || "",
      messageId: version.messageId,
      versionNumber: version.versionNumber,
      authorId: version.authorId,
      content: version.content,
      plainText: version.plainText,
      editReason: version.editReason,
      metadata: version.metadata,
      createdAt: version.createdAt,
    }));
  } catch (error) {
    console.error("Failed to get message versions:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get message versions");
  }
}

/**
 * Get a specific version of a message
 */
export async function getMessageVersion({
  messageId,
  versionNumber,
}: {
  messageId: string;
  versionNumber: number;
}): Promise<MessageVersion | null> {
  try {
    await ensureConnection();

    const version = await MessageVersionModel
      .findOne({ messageId, versionNumber })
      .lean() as any;

    if (!version) return null;

    return {
      _id: version._id?.toString() || "",
      messageId: version.messageId,
      versionNumber: version.versionNumber,
      authorId: version.authorId,
      content: version.content,
      plainText: version.plainText,
      editReason: version.editReason,
      metadata: version.metadata,
      createdAt: version.createdAt,
    };
  } catch (error) {
    console.error("Failed to get message version:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get message version");
  }
}

/**
 * Revert to a specific version (creates a new version with old content)
 */
export async function revertToVersion({
  messageId,
  targetVersionNumber,
  authorId,
  editReason,
}: {
  messageId: string;
  targetVersionNumber: number;
  authorId: string;
  editReason?: string;
}): Promise<{ message: DBMessage; version: MessageVersion }> {
  try {
    await ensureConnection();

    // 1. Get the target version content
    const targetVersion = await getMessageVersion({ messageId, versionNumber: targetVersionNumber });
    if (!targetVersion) {
      throw new ChatSDKError("not_found:database", "Target version not found");
    }

    // 2. Create new version with target content
    const result = await editMessage({
      messageId,
      authorId,
      newContent: targetVersion.content,
      editReason: editReason || `Reverted to version ${targetVersionNumber}`,
    });

    if (result.conflict) {
      throw new ChatSDKError("bad_request:database", "Version conflict during revert");
    }

    return { message: result.message, version: result.version };
  } catch (error) {
    console.error("Failed to revert to version:", error);
    throw new ChatSDKError("bad_request:database", "Failed to revert to version");
  }
}

/**
 * Get messages for a chat (latest versions only)
 */
export async function getChatMessages({
  chatId,
  limit = 50,
  offset = 0,
}: {
  chatId: string;
  limit?: number;
  offset?: number;
}): Promise<DBMessage[]> {
  try {
    await ensureConnection();

    const messages = await MessageModel
      .find({ chatId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .skip(offset)
      .lean();

    return messages.map(message => ({
      _id: message._id?.toString() || "",
      id: message.id,
      chatId: message.chatId,
      userId: message.userId,
      role: message.role,
      latestVersionId: message.latestVersionId,
      latestContent: message.latestContent,
      latestPlainText: message.latestPlainText,
      attachments: message.attachments,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    }));
  } catch (error) {
    console.error("Failed to get chat messages:", error);
    throw new ChatSDKError("bad_request:database", "Failed to get chat messages");
  }
}
