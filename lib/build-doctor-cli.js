#!/usr/bin/env node
/**
 * Build Doctor CLI
 * Autonomous build error detection and fixing
 */

async function main() {
  try {
    console.log("🔧 Activating Build Doctor...\n");

    // Dynamic import for ES module compatibility
    const { buildWithAutoFix } = await import("./build-doctor.js");

    const success = await buildWithAutoFix();

    if (success) {
      console.log("\n✅ Build Doctor: All systems operational");
      process.exit(0);
    } else {
      console.log("\n❌ Build Doctor: Unable to auto-fix all errors");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Build Doctor CLI error:", error);
    process.exit(1);
  }
}

main();
