/**
 * Devin Ops Integration
 * Connects Devin Ops Protocol to the TiQology AI Chatbot application
 */

import DevinLogger from "./devinLogger";
import { initializeDevinOps, shutdownDevinOps } from "./devinOpsService";

// ============================================
// APPLICATION INTEGRATION
// ============================================

let devinOpsInitialized = false;

/**
 * Start Devin Ops when application starts
 * Call this from your app's instrumentation.ts or startup script
 */
export async function startDevinOps(): Promise<void> {
  if (devinOpsInitialized) {
    console.log("[DevinOps] Already initialized, skipping...");
    return;
  }

  try {
    await initializeDevinOps();
    devinOpsInitialized = true;
  } catch (error) {
    console.error("[DevinOps] Failed to initialize:", error);
    throw error;
  }
}

/**
 * Stop Devin Ops gracefully
 * Call this from your app's shutdown handler
 */
export async function stopDevinOps(): Promise<void> {
  if (!devinOpsInitialized) {
    return;
  }

  try {
    await shutdownDevinOps();
    devinOpsInitialized = false;
  } catch (error) {
    console.error("[DevinOps] Failed to shutdown:", error);
  }
}

/**
 * Get Devin Ops initialization status
 */
export function isDevinOpsRunning(): boolean {
  return devinOpsInitialized;
}

// ============================================
// GRACEFUL SHUTDOWN HANDLERS
// ============================================

// Handle process termination signals
process.on("SIGTERM", async () => {
  await DevinLogger.info("Received SIGTERM, shutting down Devin Ops...");
  await stopDevinOps();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await DevinLogger.info(
    "Received SIGINT (Ctrl+C), shutting down Devin Ops..."
  );
  await stopDevinOps();
  process.exit(0);
});

// Handle uncaught errors
process.on("uncaughtException", async (error) => {
  await DevinLogger.critical("Uncaught exception in Devin Ops", {
    error,
    metadata: {
      message: error.message,
      stack: error.stack,
    },
  });
  await stopDevinOps();
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  await DevinLogger.critical("Unhandled promise rejection in Devin Ops", {
    metadata: {
      reason: String(reason),
      promise: String(promise),
    },
  });
});

// ============================================
// EXPORTS
// ============================================

export { DevinLogger };
export * from "./devinOps";
export * from "./devinOpsService";
