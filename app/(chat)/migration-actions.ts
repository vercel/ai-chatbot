"use server";

import { migrateExistingMessages, createTestMessage, testMessageEdit } from "@/lib/db/migration";

/**
 * Server action to run the migration
 */
export async function runMigrationAction() {
  try {
    const result = await migrateExistingMessages();
    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error("Migration failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server action to create a test message
 */
export async function createTestMessageAction() {
  try {
    const result = await createTestMessage();
    return {
      success: true,
      message: result.message,
      version: result.version,
    };
  } catch (error) {
    console.error("Test message creation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Server action to test message editing
 */
export async function testMessageEditAction(messageId: string) {
  try {
    const result = await testMessageEdit(messageId);
    return {
      success: true,
      message: result.message,
      version: result.version,
    };
  } catch (error) {
    console.error("Test message edit failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
