#!/usr/bin/env tsx

/**
 * Standalone Devin Ops Runner
 * Run this script to start Devin Ops as a standalone service
 *
 * Usage:
 *   npx tsx ops/scripts/start-devin.ts
 *
 * Or make executable and run directly:
 *   chmod +x ops/scripts/start-devin.ts
 *   ./ops/scripts/start-devin.ts
 */

import DevinLogger from "../../lib/devinLogger";
import { startDevinOps, stopDevinOps } from "../../lib/devinOpsIntegration";

// ============================================
// MAIN
// ============================================

async function main() {
  console.log("🚀 Starting Devin Ops Protocol...\n");

  try {
    // Start Devin Ops
    await startDevinOps();

    // Keep process alive
    console.log("✅ Devin Ops is running. Press Ctrl+C to stop.\n");

    // Heartbeat to keep process alive
    setInterval(() => {
      // Process continues running
    }, 1000);
  } catch (error) {
    await DevinLogger.critical("Failed to start Devin Ops", {
      error: error as Error,
    });
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

// ============================================
// SHUTDOWN HANDLERS
// ============================================

// Graceful shutdown on Ctrl+C
process.on("SIGINT", async () => {
  console.log("\n\n🛑 Received shutdown signal...");
  await stopDevinOps();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n\n🛑 Received termination signal...");
  await stopDevinOps();
  process.exit(0);
});

// ============================================
// RUN
// ============================================

main();
