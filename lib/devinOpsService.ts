/**
 * Devin Ops Service - Main Entry Point
 * Initializes and manages the Devin autonomous operations system
 */

import DevinLogger from "./devinLogger";
import {
  getDevinSuccessRate,
  getDevinWorkload,
  startDirectiveWatcher,
} from "./devinOps";
import { getTiqologyDb } from "./tiqologyDb";

// ============================================
// CONFIGURATION
// ============================================

const DEVIN_CONFIG = {
  WATCHER_INTERVAL_MS: 60_000, // Check for new directives every 60 seconds
  HEARTBEAT_INTERVAL_MS: 300_000, // Send heartbeat every 5 minutes
  LOG_CLEANUP_INTERVAL_MS: 86_400_000, // Clean up logs daily (24 hours)
  AGENT_ID: "devin-builder",
  AGENT_VERSION: "2.0.0",
  ENABLED: process.env.DEVIN_OPS_ENABLED !== "false", // Enable by default
};

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize Devin Ops system
 */
export async function initializeDevinOps(): Promise<void> {
  if (!DEVIN_CONFIG.ENABLED) {
    console.log(
      "[DevinOps] ⚠️  Devin Ops is disabled via DEVIN_OPS_ENABLED env var"
    );
    return;
  }

  console.log(
    "╔═══════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                                                               ║"
  );
  console.log(
    "║              🤖  DEVIN OPS PROTOCOL v2.0                      ║"
  );
  console.log(
    "║          Autonomous Build, Deploy & Telemetry Agent          ║"
  );
  console.log(
    "║                                                               ║"
  );
  console.log(
    "╚═══════════════════════════════════════════════════════════════╝"
  );
  console.log("");

  await DevinLogger.info("Devin Ops Protocol initializing...", {
    metadata: {
      version: DEVIN_CONFIG.AGENT_VERSION,
      agent_id: DEVIN_CONFIG.AGENT_ID,
      watcher_interval_ms: DEVIN_CONFIG.WATCHER_INTERVAL_MS,
    },
  });

  try {
    // Step 1: Register agent in AgentOS
    await registerAgentInAgentOS();

    // Step 2: Verify database connectivity
    await verifyDatabaseConnection();

    // Step 3: Start directive watcher
    await startDirectiveWatcher(DEVIN_CONFIG.WATCHER_INTERVAL_MS);

    // Step 4: Start heartbeat service
    startHeartbeatService();

    // Step 5: Start log cleanup service
    startLogCleanupService();

    // Step 6: Display startup summary
    await displayStartupSummary();

    await DevinLogger.info("✅ Devin Ops Protocol initialized successfully");
  } catch (error) {
    await DevinLogger.critical("Failed to initialize Devin Ops Protocol", {
      error: error as Error,
      metadata: {
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
    throw error;
  }
}

// ============================================
// AGENTOS REGISTRATION
// ============================================

/**
 * Register Devin as an agent in AgentOS
 */
async function registerAgentInAgentOS(): Promise<void> {
  const supabase = getTiqologyDb();

  try {
    // Check if agent already exists
    const { data: existingAgent } = await supabase
      .from("agentos_agents")
      .select("id")
      .eq("agent_id", DEVIN_CONFIG.AGENT_ID)
      .single();

    if (existingAgent) {
      // Update existing agent
      await supabase
        .from("agentos_agents")
        .update({
          status: "active",
          version: DEVIN_CONFIG.AGENT_VERSION,
          last_seen_at: new Date().toISOString(),
          capabilities: {
            features: [
              "autonomous-directive-execution",
              "branch-management",
              "code-generation",
              "database-migrations",
              "pull-request-creation",
              "deployment-automation",
              "telemetry-logging",
            ],
            max_concurrent_tasks: 3,
            supported_directive_types: [
              "feature",
              "bugfix",
              "migration",
              "deployment",
            ],
          },
        })
        .eq("agent_id", DEVIN_CONFIG.AGENT_ID);

      await DevinLogger.info("Updated existing agent registration in AgentOS");
    } else {
      // Create new agent
      await supabase.from("agentos_agents").insert({
        agent_id: DEVIN_CONFIG.AGENT_ID,
        name: "Devin Builder",
        type: "autonomous-engineer",
        status: "active",
        version: DEVIN_CONFIG.AGENT_VERSION,
        capabilities: {
          features: [
            "autonomous-directive-execution",
            "branch-management",
            "code-generation",
            "database-migrations",
            "pull-request-creation",
            "deployment-automation",
            "telemetry-logging",
          ],
          max_concurrent_tasks: 3,
          supported_directive_types: [
            "feature",
            "bugfix",
            "migration",
            "deployment",
          ],
        },
        metadata: {
          description:
            "Autonomous build, deploy, and telemetry agent for TiQology engineering operations",
          documentation: "ops/directives/README.md",
        },
      });

      await DevinLogger.info("Registered new agent in AgentOS");
    }
  } catch (error) {
    await DevinLogger.error("Failed to register agent in AgentOS", {
      error: error as Error,
    });
    throw error;
  }
}

// ============================================
// DATABASE VERIFICATION
// ============================================

/**
 * Verify database connection and required tables exist
 */
async function verifyDatabaseConnection(): Promise<void> {
  const supabase = getTiqologyDb();

  try {
    // Test basic connectivity
    const { data, error } = await supabase
      .from("devin_operations")
      .select("id")
      .limit(1);

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    await DevinLogger.info("Database connection verified");

    // Verify required tables exist
    const requiredTables = [
      "devin_operations",
      "devin_operation_steps",
      "devin_telemetry",
      "agentos_agents",
      "agentos_event_log",
    ];

    for (const table of requiredTables) {
      const { error: tableError } = await supabase
        .from(table)
        .select("id")
        .limit(1);

      if (tableError) {
        throw new Error(`Required table missing: ${table}`);
      }
    }

    await DevinLogger.info("All required database tables verified");
  } catch (error) {
    await DevinLogger.critical("Database verification failed", {
      error: error as Error,
    });
    throw error;
  }
}

// ============================================
// HEARTBEAT SERVICE
// ============================================

/**
 * Send periodic heartbeat to AgentOS
 */
function startHeartbeatService(): void {
  setInterval(async () => {
    try {
      const supabase = getTiqologyDb();

      // Update agent last_seen_at
      await supabase
        .from("agentos_agents")
        .update({
          last_seen_at: new Date().toISOString(),
          status: "active",
        })
        .eq("agent_id", DEVIN_CONFIG.AGENT_ID);

      // Get current workload
      const workload = await getDevinWorkload();

      // Log heartbeat
      await supabase.from("agentos_event_log").insert({
        event_type: "agent_heartbeat",
        agent_id: DEVIN_CONFIG.AGENT_ID,
        status: "completed",
        metadata: {
          workload,
          timestamp: new Date().toISOString(),
        },
      });

      await DevinLogger.debug("Heartbeat sent", {
        metadata: { workload },
      });
    } catch (error) {
      await DevinLogger.error("Heartbeat failed", {
        error: error as Error,
      });
    }
  }, DEVIN_CONFIG.HEARTBEAT_INTERVAL_MS);

  DevinLogger.info(
    `Heartbeat service started (interval: ${DEVIN_CONFIG.HEARTBEAT_INTERVAL_MS}ms)`
  );
}

// ============================================
// LOG CLEANUP SERVICE
// ============================================

/**
 * Clean up old log files periodically
 */
function startLogCleanupService(): void {
  setInterval(async () => {
    try {
      await DevinLogger.cleanupOldLogs(30); // Keep logs for 30 days
      await DevinLogger.info("Log cleanup completed");
    } catch (error) {
      await DevinLogger.error("Log cleanup failed", {
        error: error as Error,
      });
    }
  }, DEVIN_CONFIG.LOG_CLEANUP_INTERVAL_MS);

  DevinLogger.info(
    `Log cleanup service started (interval: ${DEVIN_CONFIG.LOG_CLEANUP_INTERVAL_MS}ms)`
  );
}

// ============================================
// STARTUP SUMMARY
// ============================================

/**
 * Display startup summary with current stats
 */
async function displayStartupSummary(): Promise<void> {
  try {
    const workload = await getDevinWorkload();
    const successRate = await getDevinSuccessRate(7);

    console.log("");
    console.log(
      "┌─────────────────────────────────────────────────────────────┐"
    );
    console.log(
      "│                     DEVIN OPS STATUS                        │"
    );
    console.log(
      "├─────────────────────────────────────────────────────────────┤"
    );
    console.log(`│ Agent ID:           ${DEVIN_CONFIG.AGENT_ID.padEnd(38)} │`);
    console.log(
      `│ Version:            ${DEVIN_CONFIG.AGENT_VERSION.padEnd(38)} │`
    );
    console.log(`│ Status:             ${"Active".padEnd(38)} │`);
    console.log(
      "├─────────────────────────────────────────────────────────────┤"
    );
    console.log(
      `│ Pending Directives: ${String(workload.pending).padEnd(38)} │`
    );
    console.log(
      `│ In Progress:        ${String(workload.inProgress).padEnd(38)} │`
    );
    console.log(
      `│ Completed Today:    ${String(workload.totalToday).padEnd(38)} │`
    );
    console.log(
      `│ Avg Time (Today):   ${String(workload.avgTimeToday) + "ms".padEnd(38)} │`
    );
    console.log(
      "├─────────────────────────────────────────────────────────────┤"
    );
    console.log(
      `│ Success Rate (7d):  ${String(successRate.successRate.toFixed(1)) + "%".padEnd(38)} │`
    );
    console.log(
      `│ Total Operations:   ${String(successRate.totalOperations).padEnd(38)} │`
    );
    console.log(
      `│ Successful:         ${String(successRate.successfulOperations).padEnd(38)} │`
    );
    console.log(
      `│ Failed:             ${String(successRate.failedOperations).padEnd(38)} │`
    );
    console.log(
      "└─────────────────────────────────────────────────────────────┘"
    );
    console.log("");
    console.log("🔍 Watching: /ops/directives/pending/");
    console.log("📊 Logging:  /ops/logs/ + TiQology Core DB");
    console.log("🚀 Ready:    Devin will auto-execute new directives");
    console.log("");
  } catch (error) {
    console.log("⚠️  Unable to fetch startup stats");
  }
}

// ============================================
// SHUTDOWN
// ============================================

/**
 * Gracefully shutdown Devin Ops
 */
export async function shutdownDevinOps(): Promise<void> {
  console.log("");
  await DevinLogger.info("Devin Ops Protocol shutting down...");

  try {
    const supabase = getTiqologyDb();

    // Update agent status to offline
    await supabase
      .from("agentos_agents")
      .update({
        status: "offline",
        last_seen_at: new Date().toISOString(),
      })
      .eq("agent_id", DEVIN_CONFIG.AGENT_ID);

    await DevinLogger.info("✅ Devin Ops Protocol shutdown complete");
    console.log("👋 Goodbye!");
  } catch (error) {
    await DevinLogger.error("Error during shutdown", {
      error: error as Error,
    });
  }
}

// ============================================
// EXPORTS
// ============================================

export const DevinOpsService = {
  initialize: initializeDevinOps,
  shutdown: shutdownDevinOps,
  config: DEVIN_CONFIG,
};

export default DevinOpsService;
