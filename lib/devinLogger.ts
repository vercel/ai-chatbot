/**
 * Devin Logging & Telemetry Module
 * Comprehensive logging system for autonomous operations
 */

import * as fs from "fs/promises";
import * as path from "path";
import { getTiqologyDb } from "./tiqologyDb";

// ============================================
// TYPES
// ============================================

export type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  operation_id?: string;
  directive_id?: string;
  agent: string;
  message: string;
  metadata?: Record<string, any>;
  error_stack?: string;
}

export interface TelemetryEvent {
  event_type: string;
  agent_id: string;
  operation_id?: string;
  directive_id?: string;
  status: "started" | "completed" | "failed" | "blocked";
  duration_ms?: number;
  metadata?: Record<string, any>;
  error_message?: string;
}

// ============================================
// CONFIGURATION
// ============================================

const LOG_DIR = "/workspaces/ai-chatbot/ops/logs";
const AGENT_ID = "devin-builder";

// ============================================
// FILE LOGGING
// ============================================

/**
 * Initialize log directory
 */
async function ensureLogDirectory(): Promise<void> {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (error) {
    console.error("[DevinLogger] Failed to create log directory:", error);
  }
}

/**
 * Write log entry to file
 */
async function writeToLogFile(entry: LogEntry): Promise<void> {
  await ensureLogDirectory();

  const date = new Date().toISOString().split("T")[0];
  const logFile = path.join(LOG_DIR, `devin-${date}.log`);

  const logLine = JSON.stringify(entry) + "\n";

  try {
    await fs.appendFile(logFile, logLine, "utf-8");
  } catch (error) {
    console.error("[DevinLogger] Failed to write to log file:", error);
  }
}

/**
 * Write error to separate error log
 */
async function writeToErrorLog(entry: LogEntry): Promise<void> {
  await ensureLogDirectory();

  const date = new Date().toISOString().split("T")[0];
  const errorFile = path.join(LOG_DIR, `devin-errors-${date}.log`);

  const logLine = JSON.stringify(entry, null, 2) + "\n---\n";

  try {
    await fs.appendFile(errorFile, logLine, "utf-8");
  } catch (error) {
    console.error("[DevinLogger] Failed to write to error log:", error);
  }
}

// ============================================
// DATABASE LOGGING
// ============================================

/**
 * Write log entry to database
 */
async function writeToDatabase(entry: LogEntry): Promise<void> {
  const supabase = getTiqologyDb();

  try {
    await supabase.from("devin_logs").insert({
      timestamp: entry.timestamp,
      level: entry.level,
      operation_id: entry.operation_id,
      directive_id: entry.directive_id,
      agent: entry.agent,
      message: entry.message,
      metadata: entry.metadata,
      error_stack: entry.error_stack,
    });
  } catch (error) {
    console.error("[DevinLogger] Failed to write to database:", error);
  }
}

// ============================================
// AGENTOS LOGGING
// ============================================

/**
 * Send telemetry to AgentOS event log
 */
async function logToAgentOS(event: TelemetryEvent): Promise<void> {
  const supabase = getTiqologyDb();

  try {
    await supabase.from("agentos_event_log").insert({
      event_type: event.event_type,
      agent_id: event.agent_id,
      task_id: event.directive_id,
      status: event.status,
      duration_ms: event.duration_ms,
      error_message: event.error_message,
      metadata: event.metadata,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[DevinLogger] Failed to log to AgentOS:", error);
  }
}

// ============================================
// PUBLIC LOGGING INTERFACE
// ============================================

/**
 * Core logging function
 */
async function log(
  level: LogLevel,
  message: string,
  options?: {
    operation_id?: string;
    directive_id?: string;
    metadata?: Record<string, any>;
    error?: Error;
    writeToDb?: boolean;
  }
): Promise<void> {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    operation_id: options?.operation_id,
    directive_id: options?.directive_id,
    agent: AGENT_ID,
    message,
    metadata: options?.metadata,
    error_stack: options?.error?.stack,
  };

  // Console output with color coding
  const colors = {
    debug: "\x1b[36m", // Cyan
    info: "\x1b[32m", // Green
    warn: "\x1b[33m", // Yellow
    error: "\x1b[31m", // Red
    critical: "\x1b[35m", // Magenta
  };
  const reset = "\x1b[0m";

  console.log(
    `${colors[level]}[${level.toUpperCase()}]${reset} [${entry.timestamp}] ${message}`,
    options?.metadata ? JSON.stringify(options.metadata, null, 2) : ""
  );

  // Write to log file
  await writeToLogFile(entry);

  // Write errors to separate error log
  if (level === "error" || level === "critical") {
    await writeToErrorLog(entry);
  }

  // Write to database (optional, enabled by default for warn/error/critical)
  if (
    options?.writeToDb !== false &&
    (level === "warn" || level === "error" || level === "critical")
  ) {
    await writeToDatabase(entry);
  }
}

/**
 * Log debug message
 */
export async function debug(
  message: string,
  options?: {
    operation_id?: string;
    directive_id?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  await log("debug", message, { ...options, writeToDb: false });
}

/**
 * Log info message
 */
export async function info(
  message: string,
  options?: {
    operation_id?: string;
    directive_id?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  await log("info", message, { ...options, writeToDb: false });
}

/**
 * Log warning message
 */
export async function warn(
  message: string,
  options?: {
    operation_id?: string;
    directive_id?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  await log("warn", message, options);
}

/**
 * Log error message
 */
export async function error(
  message: string,
  options?: {
    operation_id?: string;
    directive_id?: string;
    metadata?: Record<string, any>;
    error?: Error;
  }
): Promise<void> {
  await log("error", message, options);
}

/**
 * Log critical error message
 */
export async function critical(
  message: string,
  options?: {
    operation_id?: string;
    directive_id?: string;
    metadata?: Record<string, any>;
    error?: Error;
  }
): Promise<void> {
  await log("critical", message, options);
}

// ============================================
// OPERATION LIFECYCLE LOGGING
// ============================================

/**
 * Log directive start
 */
export async function logDirectiveStart(
  directiveId: string,
  directiveTitle: string,
  metadata?: Record<string, any>
): Promise<void> {
  await info(`Directive started: ${directiveTitle}`, {
    directive_id: directiveId,
    metadata,
  });

  await logToAgentOS({
    event_type: "directive_started",
    agent_id: AGENT_ID,
    directive_id: directiveId,
    status: "started",
    metadata: {
      title: directiveTitle,
      ...metadata,
    },
  });
}

/**
 * Log directive completion
 */
export async function logDirectiveComplete(
  directiveId: string,
  operationId: string,
  durationMs: number,
  metadata?: Record<string, any>
): Promise<void> {
  await info("Directive completed successfully", {
    directive_id: directiveId,
    operation_id: operationId,
    metadata: {
      duration_ms: durationMs,
      ...metadata,
    },
  });

  await logToAgentOS({
    event_type: "directive_completed",
    agent_id: AGENT_ID,
    directive_id: directiveId,
    operation_id: operationId,
    status: "completed",
    duration_ms: durationMs,
    metadata,
  });
}

/**
 * Log directive failure
 */
export async function logDirectiveFailure(
  directiveId: string,
  operationId: string,
  errorMessage: string,
  durationMs?: number,
  metadata?: Record<string, any>
): Promise<void> {
  await error(`Directive failed: ${errorMessage}`, {
    directive_id: directiveId,
    operation_id: operationId,
    metadata,
  });

  await logToAgentOS({
    event_type: "directive_failed",
    agent_id: AGENT_ID,
    directive_id: directiveId,
    operation_id: operationId,
    status: "failed",
    duration_ms: durationMs,
    error_message: errorMessage,
    metadata,
  });
}

/**
 * Log step execution
 */
export async function logStepExecution(
  operationId: string,
  stepNumber: number,
  stepAction: string,
  status: "started" | "completed" | "failed",
  metadata?: Record<string, any>
): Promise<void> {
  const level = status === "failed" ? "error" : "info";

  await log(level, `Step ${stepNumber}: ${stepAction} - ${status}`, {
    operation_id: operationId,
    metadata: {
      step_number: stepNumber,
      step_action: stepAction,
      status,
      ...metadata,
    },
    writeToDb: false,
  });
}

// ============================================
// PERFORMANCE TRACKING
// ============================================

/**
 * Log performance metric
 */
export async function logPerformanceMetric(
  metricName: string,
  value: number,
  unit: string,
  operationId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await info(`Performance: ${metricName} = ${value}${unit}`, {
    operation_id: operationId,
    metadata: {
      metric_name: metricName,
      value,
      unit,
      ...metadata,
    },
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get recent logs from database
 */
export async function getRecentLogs(
  limit = 100,
  level?: LogLevel
): Promise<LogEntry[]> {
  const supabase = getTiqologyDb();

  let query = supabase
    .from("devin_logs")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (level) {
    query = query.eq("level", level);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[DevinLogger] Failed to fetch recent logs:", error);
    return [];
  }

  return data as LogEntry[];
}

/**
 * Get logs for specific operation
 */
export async function getOperationLogs(
  operationId: string
): Promise<LogEntry[]> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("devin_logs")
    .select("*")
    .eq("operation_id", operationId)
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("[DevinLogger] Failed to fetch operation logs:", error);
    return [];
  }

  return data as LogEntry[];
}

/**
 * Get error logs from last N days
 */
export async function getRecentErrors(days = 7): Promise<LogEntry[]> {
  const supabase = getTiqologyDb();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("devin_logs")
    .select("*")
    .in("level", ["error", "critical"])
    .gte("timestamp", startDate.toISOString())
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("[DevinLogger] Failed to fetch recent errors:", error);
    return [];
  }

  return data as LogEntry[];
}

/**
 * Clean up old log files (older than 30 days)
 */
export async function cleanupOldLogs(daysToKeep = 30): Promise<void> {
  await ensureLogDirectory();

  try {
    const files = await fs.readdir(LOG_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    for (const file of files) {
      if (file.startsWith("devin-") && file.endsWith(".log")) {
        const filePath = path.join(LOG_DIR, file);
        const stats = await fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`[DevinLogger] Deleted old log file: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error("[DevinLogger] Failed to cleanup old logs:", error);
  }
}

// ============================================
// EXPORTS
// ============================================

export const DevinLogger = {
  debug,
  info,
  warn,
  error,
  critical,
  logDirectiveStart,
  logDirectiveComplete,
  logDirectiveFailure,
  logStepExecution,
  logPerformanceMetric,
  getRecentLogs,
  getOperationLogs,
  getRecentErrors,
  cleanupOldLogs,
};

export default DevinLogger;
