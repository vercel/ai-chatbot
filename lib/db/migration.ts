import { MessageModel, MessageVersionModel } from "./models";

/**
 * Migrate existing messages to the new versioning system
 * This will:
 * 1. Find messages that don't have latestVersionId (old format)
 * 2. Create MessageVersion records for them
 * 3. Update the message with denormalized latest content
 */
export async function migrateExistingMessages() {
  try {
    console.log("🔄 Starting message migration to new versioning system...");
    
    // Find messages that need migration (don't have latestVersionId)
    const messagesToMigrate = await MessageModel.find({
      $or: [
        { latestVersionId: { $exists: false } },
        { latestVersionId: null }
      ]
    }).lean();

    console.log(`📦 Found ${messagesToMigrate.length} messages to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const message of messagesToMigrate) {
      try {
        const session = await MessageModel.startSession();
        
        await session.withTransaction(async () => {
          // Extract content and plain text
          const content = (message as any).parts || (message as any).latestContent;
          const plainText = extractPlainText(content);
          
          // Create version 1 for this message
          const versionDoc = await MessageVersionModel.create([{
            messageId: message.id,
            versionNumber: 1,
            authorId: (message as any).userId || "unknown", // Use message userId if available
            content: content,
            plainText: plainText,
            editReason: "Migration from old system",
            createdAt: message.createdAt,
          }], { session });

          // Update the message with new schema fields
          await MessageModel.updateOne(
            { _id: message._id },
            {
              $set: {
                userId: (message as any).userId || "unknown",
                latestVersionId: versionDoc[0]._id.toString(),
                latestContent: content,
                latestPlainText: plainText,
              },
              $unset: {
                // Remove old versioning fields if they exist
                versionGroupId: 1,
                versionNumber: 1,
                isCurrentVersion: 1,
                parentVersionId: 1,
                parts: 1, // Move parts to latestContent
              }
            },
            { session }
          );
        });

        await session.endSession();
        migratedCount++;
        
        if (migratedCount % 10 === 0) {
          console.log(`✅ Migrated ${migratedCount} messages...`);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate message ${message.id}:`, error);
        errorCount++;
      }
    }

    console.log(`🎉 Migration completed!`);
    console.log(`   ✅ Successfully migrated: ${migratedCount} messages`);
    console.log(`   ❌ Failed to migrate: ${errorCount} messages`);
    
    return {
      total: messagesToMigrate.length,
      migrated: migratedCount,
      errors: errorCount,
    };
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

/**
 * Extract plain text from message content
 */
function extractPlainText(content: any): string {
  if (!content) return "";
  
  if (Array.isArray(content)) {
    return content
      .filter(part => part.type === "text")
      .map(part => part.text || "")
      .join(" ")
      .trim();
  }
  
  if (typeof content === "string") {
    return content;
  }
  
  return "";
}

/**
 * Create a test message to verify the new system works
 */
export async function createTestMessage() {
  const { createMessage } = await import("./versioning");
  
  const testMessage = await createMessage({
    id: `test-${Date.now()}`,
    chatId: "test-chat",
    userId: "test-user",
    role: "user",
    content: [{ type: "text", text: "This is a test message for the new versioning system!" }],
    attachments: [],
  });

  console.log("✅ Created test message:", testMessage.message.id);
  return testMessage;
}

/**
 * Test editing a message to verify versioning works
 */
export async function testMessageEdit(messageId: string) {
  const { editMessage } = await import("./versioning");
  
  const editResult = await editMessage({
    messageId,
    authorId: "test-user",
    newContent: [{ type: "text", text: "This is an edited version of the test message!" }],
    editReason: "Testing the edit functionality",
  });

  console.log("✅ Edited message, created version:", editResult.version.versionNumber);
  return editResult;
}
