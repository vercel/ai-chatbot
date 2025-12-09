/**
 * Devin Operations Module
 * Autonomous directive execution and telemetry system
 */

import { exec } from "child_process";
import * as fs from "fs/promises";
import { promisify } from "util";
import * as yaml from "yaml";
import GitHubOps from "./githubOps";
import { getTiqologyDb } from "./tiqologyDb";

const execAsync = promisify(exec);

// ============================================
// TYPES
// ============================================

export interface Directive {
  id: string;
  title: string;
  priority: "critical" | "high" | "normal" | "low";
  status: "pending" | "in-progress" | "completed" | "failed" | "blocked";
  created_at: string;
  created_by: string;
  assigned_to: string;

  context: {
    description: string;
    background: string;
    related_docs?: string[];
  };

  objectives: string[];

  technical_specs: {
    repositories?: RepositorySpec[];
    database_changes?: string[];
    environment_variables?: string[];
    dependencies?: string[];
  };

  execution_steps: ExecutionStep[];
  validation: ValidationCriterion[];
  success_metrics: string[];
  rollback?: string[];
  notes?: string;

  telemetry: {
    log_to_db: boolean;
    log_to_agentos: boolean;
    notify_on_completion: boolean;
    notify_channels?: string[];
  };
}

export interface RepositorySpec {
  name: string;
  branch: string;
  actions: string[];
}

export interface ExecutionStep {
  step: number;
  action: string;
  command?: string;
  files_to_create?: string[];
  files_to_edit?: string[];
  github_bot_commands?: string[]; // NEW: GitHub bot commands
  wait_for_bot_response?: boolean; // NEW: Wait for bot confirmation
  bot_timeout_ms?: number; // NEW: Timeout for bot response
  retry_on_failure?: boolean;
  max_retries?: number;
}

export interface ValidationCriterion {
  criterion: string;
  test_command?: string;
  manual_test?: string;
}

export interface DevinOperation {
  id: string;
  directive_id: string;
  directive_title: string;
  directive_priority: string;
  status: string;
  started_at?: Date;
  completed_at?: Date;
  execution_time_ms?: number;
  steps_total: number;
  steps_completed: number;
  steps_failed: number;
  repository?: string;
  branch_name?: string;
  commit_sha?: string;
  pr_number?: number;
  pr_url?: string;
  created_by: string;
  validation_passed?: boolean;
  validation_results?: Record<string, any>;
  error_message?: string;
  files_created?: string[];
  files_modified?: string[];
  files_deleted?: string[];
  metadata?: Record<string, any>;
}

export interface OperationStep {
  operation_id: string;
  step_number: number;
  step_action: string;
  step_command?: string;
  status: string;
  started_at?: Date;
  completed_at?: Date;
  duration_ms?: number;
  output?: string;
  error_message?: string;
  retry_count: number;
}

// ============================================
// DIRECTIVE DETECTION
// ============================================

/**
 * Scan for pending directives
 */
export async function scanPendingDirectives(): Promise<string[]> {
  const dirPath = "/workspaces/ai-chatbot/ops/directives/pending";

  try {
    const files = await fs.readdir(dirPath);
    return files.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"));
  } catch (error) {
    console.error("[Devin] Error scanning pending directives:", error);
    return [];
  }
}

/**
 * Load and parse a directive file
 */
export async function loadDirective(filename: string): Promise<Directive> {
  const filePath = `/workspaces/ai-chatbot/ops/directives/pending/${filename}`;
  const content = await fs.readFile(filePath, "utf-8");
  const directive = yaml.parse(content) as Directive;

  // Validate directive structure
  validateDirective(directive);

  return directive;
}

/**
 * Validate directive has required fields
 */
function validateDirective(directive: Directive): void {
  const required = ["id", "title", "priority", "execution_steps"];
  for (const field of required) {
    if (!directive[field as keyof Directive]) {
      throw new Error(`Directive missing required field: ${field}`);
    }
  }
}

// ============================================
// DIRECTIVE EXECUTION
// ============================================

/**
 * Execute a directive from start to finish
 */
export async function executeDirective(
  directive: Directive
): Promise<DevinOperation> {
  const supabase = getTiqologyDb();

  // Create operation record
  const { data: operation, error: createError } = await supabase
    .from("devin_operations")
    .insert({
      directive_id: directive.id,
      directive_title: directive.title,
      directive_priority: directive.priority,
      status: "in-progress",
      started_at: new Date().toISOString(),
      steps_total: directive.execution_steps.length,
      steps_completed: 0,
      steps_failed: 0,
      created_by: directive.created_by,
      repository: directive.technical_specs.repositories?.[0]?.name,
      branch_name: directive.technical_specs.repositories?.[0]?.branch,
    })
    .select()
    .single();

  if (createError || !operation) {
    throw new Error(
      `Failed to create operation record: ${createError?.message}`
    );
  }

  console.log(`[Devin] Starting directive: ${directive.id}`);

  try {
    // Execute each step
    for (const step of directive.execution_steps) {
      await executeStep(operation.id, step);
    }

    // Run validation
    const validationResults = await runValidation(directive.validation);
    const allPassed = Object.values(validationResults).every((v) => v === true);

    // Update operation status
    await supabase
      .from("devin_operations")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        validation_passed: allPassed,
        validation_results: validationResults,
      })
      .eq("id", operation.id);

    // Move directive to completed folder
    await moveDirective(directive.id, "completed");

    // Log to AgentOS
    if (directive.telemetry.log_to_agentos) {
      await logToAgentOS(operation.id, "completed");
    }

    console.log(`[Devin] ✅ Directive ${directive.id} completed successfully`);

    return operation as DevinOperation;
  } catch (error) {
    // Handle failure
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    await supabase
      .from("devin_operations")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
        error_stack: error instanceof Error ? error.stack : undefined,
      })
      .eq("id", operation.id);

    // Move directive to failed folder
    await moveDirective(directive.id, "failed");

    // Log to AgentOS
    if (directive.telemetry.log_to_agentos) {
      await logToAgentOS(operation.id, "failed", errorMessage);
    }

    console.error(`[Devin] ❌ Directive ${directive.id} failed:`, errorMessage);

    throw error;
  }
}

/**
 * Execute a single step
 */
async function executeStep(
  operationId: string,
  step: ExecutionStep
): Promise<void> {
  const supabase = getTiqologyDb();
  const startTime = Date.now();

  // Create step record
  const { data: stepRecord } = await supabase
    .from("devin_operation_steps")
    .insert({
      operation_id: operationId,
      step_number: step.step,
      step_action: step.action,
      step_command: step.command,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (!stepRecord) {
    throw new Error(`Failed to create step record for step ${step.step}`);
  }

  console.log(`[Devin] Step ${step.step}: ${step.action}`);

  try {
    let output = "";

    // Execute step based on type
    if (step.command) {
      const { stdout, stderr } = await execAsync(step.command);
      output = stdout || stderr;
    }

    // Handle file creation
    if (step.files_to_create) {
      for (const file of step.files_to_create) {
        console.log(`[Devin]   Creating file: ${file}`);
        // File creation would happen here via code generation
      }
    }

    // Handle file editing
    if (step.files_to_edit) {
      for (const file of step.files_to_edit) {
        console.log(`[Devin]   Editing file: ${file}`);
        // File editing would happen here via code generation
      }
    }

    // Handle GitHub bot commands (NEW)
    if (step.github_bot_commands && step.github_bot_commands.length > 0) {
      console.log(
        `[Devin]   Executing ${step.github_bot_commands.length} bot command(s)`
      );

      // Get PR number from operation metadata
      const { data: operation } = await supabase
        .from("devin_operations")
        .select("pr_number")
        .eq("id", operationId)
        .single();

      if (!operation?.pr_number) {
        throw new Error(
          "PR number not found in operation. Create PR before using bot commands."
        );
      }

      // Parse and execute bot commands
      const commands = GitHubOps.parseBotCommands(
        step.github_bot_commands.join("\n")
      );
      const responses = await GitHubOps.executeBotCommands(
        operation.pr_number,
        commands,
        step.bot_timeout_ms || 300_000
      );

      // Check if all bots responded successfully
      const allSuccess = Array.from(responses.values()).every(
        (response) => response.status === "success"
      );

      if (!allSuccess && step.wait_for_bot_response) {
        const failedBots = Array.from(responses.entries())
          .filter(([_, response]) => response.status !== "success")
          .map(([bot, response]) => `${bot}: ${response.status}`);

        throw new Error(`Bot command(s) failed: ${failedBots.join(", ")}`);
      }

      output = JSON.stringify(Array.from(responses.entries()), null, 2);
    }

    // Mark step as completed
    await supabase
      .from("devin_operation_steps")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        output: output.substring(0, 10_000), // Limit output size
      })
      .eq("id", stepRecord.id);

    console.log(`[Devin]   ✅ Step ${step.step} completed`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Mark step as failed
    await supabase
      .from("devin_operation_steps")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
        error_message: errorMessage,
      })
      .eq("id", stepRecord.id);

    console.error(`[Devin]   ❌ Step ${step.step} failed:`, errorMessage);

    // Retry logic
    if (
      step.retry_on_failure &&
      stepRecord.retry_count < (step.max_retries || 3)
    ) {
      console.log(`[Devin]   🔄 Retrying step ${step.step}...`);
      await supabase
        .from("devin_operation_steps")
        .update({ retry_count: stepRecord.retry_count + 1 })
        .eq("id", stepRecord.id);

      // Retry the step
      return executeStep(operationId, step);
    }

    throw error;
  }
}

/**
 * Run validation criteria
 */
async function runValidation(
  criteria: ValidationCriterion[]
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};

  for (const criterion of criteria) {
    console.log(`[Devin] Validating: ${criterion.criterion}`);

    try {
      if (criterion.test_command) {
        const { stdout } = await execAsync(criterion.test_command);
        results[criterion.criterion] = stdout.length > 0;
      } else if (criterion.manual_test) {
        // Manual tests require human verification
        console.log(
          `[Devin]   ⚠️ Manual test required: ${criterion.manual_test}`
        );
        results[criterion.criterion] = false; // Assume false until manually verified
      } else {
        results[criterion.criterion] = true; // No validation specified
      }
    } catch (error) {
      console.error("[Devin]   ❌ Validation failed:", error);
      results[criterion.criterion] = false;
    }
  }

  return results;
}

// ============================================
// FILE OPERATIONS
// ============================================

/**
 * Move directive to different status folder
 */
async function moveDirective(
  directiveId: string,
  status: "pending" | "in-progress" | "completed" | "failed" | "blocked"
): Promise<void> {
  const basePath = "/workspaces/ai-chatbot/ops/directives";
  const filename = `${directiveId}.yaml`;

  try {
    // Find the directive in all folders
    const folders = [
      "pending",
      "in-progress",
      "completed",
      "failed",
      "blocked",
    ];
    let sourceFolder = "";

    for (const folder of folders) {
      try {
        await fs.access(`${basePath}/${folder}/${filename}`);
        sourceFolder = folder;
        break;
      } catch {
        // File not in this folder
      }
    }

    if (!sourceFolder) {
      console.warn(`[Devin] Directive ${directiveId} not found in any folder`);
      return;
    }

    // Move to new folder
    await fs.rename(
      `${basePath}/${sourceFolder}/${filename}`,
      `${basePath}/${status}/${filename}`
    );

    console.log(
      `[Devin] Moved directive ${directiveId}: ${sourceFolder} → ${status}`
    );
  } catch (error) {
    console.error("[Devin] Error moving directive:", error);
  }
}

// ============================================
// AGENTOS INTEGRATION
// ============================================

/**
 * Log operation to AgentOS telemetry
 */
async function logToAgentOS(
  operationId: string,
  status: string,
  errorMessage?: string
): Promise<void> {
  const supabase = getTiqologyDb();

  const { data: operation } = await supabase
    .from("devin_operations")
    .select("*")
    .eq("id", operationId)
    .single();

  if (!operation) return;

  // Log to agentos_event_log
  await supabase.from("agentos_event_log").insert({
    event_type: "devin_operation",
    agent_id: "devin-builder",
    task_id: operation.directive_id,
    status: status === "completed" ? "completed" : "failed",
    duration_ms: operation.execution_time_ms,
    error_message: errorMessage,
    metadata: {
      directive_title: operation.directive_title,
      repository: operation.repository,
      branch: operation.branch_name,
      pr_url: operation.pr_url,
      steps_total: operation.steps_total,
      steps_completed: operation.steps_completed,
      steps_failed: operation.steps_failed,
    },
  });
}

// ============================================
// TELEMETRY & REPORTING
// ============================================

/**
 * Get Devin's current workload
 */
export async function getDevinWorkload(): Promise<{
  pending: number;
  inProgress: number;
  totalToday: number;
  avgTimeToday: number;
}> {
  const supabase = getTiqologyDb();

  const { data } = await supabase.rpc("get_devin_workload");

  return (
    data?.[0] || {
      pending: 0,
      inProgress: 0,
      totalToday: 0,
      avgTimeToday: 0,
    }
  );
}

/**
 * Get Devin's success rate
 */
export async function getDevinSuccessRate(days = 7): Promise<{
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  successRate: number;
}> {
  const supabase = getTiqologyDb();

  const { data } = await supabase.rpc("get_devin_success_rate", {
    p_days: days,
  });

  return (
    data?.[0] || {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      successRate: 0,
    }
  );
}

/**
 * Get recent operations
 */
export async function getRecentOperations(
  limit = 10
): Promise<DevinOperation[]> {
  const supabase = getTiqologyDb();

  const { data, error } = await supabase
    .from("devin_operations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[Devin] Error fetching recent operations:", error);
    return [];
  }

  return data as DevinOperation[];
}

// ============================================
// DIRECTIVE WATCHER (Auto-Execution)
// ============================================

/**
 * Watch for new directives and execute them
 */
export async function startDirectiveWatcher(
  intervalMs = 60_000
): Promise<void> {
  console.log("[Devin] 🚀 Directive watcher started");

  setInterval(async () => {
    try {
      const pendingFiles = await scanPendingDirectives();

      if (pendingFiles.length > 0) {
        console.log(
          `[Devin] Found ${pendingFiles.length} pending directive(s)`
        );

        for (const file of pendingFiles) {
          try {
            const directive = await loadDirective(file);
            await executeDirective(directive);
          } catch (error) {
            console.error(`[Devin] Error executing directive ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("[Devin] Error in directive watcher:", error);
    }
  }, intervalMs);
}
