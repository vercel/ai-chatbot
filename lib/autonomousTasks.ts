function isCancelledStatus(status: TaskStatus): status is "cancelled" {
  return status === "cancelled";
}

/**
 * TiQology Nexus - Autonomous Task Execution Engine
 * AI that works while you sleep
 *
 * Features:
 * - Long-running background tasks
 * - Multi-step workflow execution
 * - Decision-making with approval gates
 * - Error recovery and rollback
 * - Activity logging and audit trail
 * - Email/notification system
 */

import { EventEmitter } from "events";
import { OpenAI } from "openai";
import { deploySwarm } from "./agentSwarm";

// ============================================
// TYPES
// ============================================

export type TaskStatus =
  | "pending"
  | "running"
  | "waiting-approval"
  | "completed"
  | "failed"
  | "cancelled";

export interface AutonomousTask {
  id: string;
  goal: string;
  status: TaskStatus;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  userId: string;
  context?: Record<string, any>;
  steps: TaskStep[];
  decisions: TaskDecision[];
  approvals: TaskApproval[];
  results?: any;
  error?: string;
  logs: TaskLog[];
}

export interface TaskStep {
  id: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "failed" | "skipped";
  startedAt?: Date;
  completedAt?: Date;
  output?: any;
  error?: string;
  requiresApproval: boolean;
}

export interface TaskDecision {
  id: string;
  question: string;
  options: string[];
  chosen: string;
  reasoning: string;
  confidence: number;
  timestamp: Date;
  autoDecided: boolean;
}

export interface TaskApproval {
  id: string;
  request: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: Date;
  respondedAt?: Date;
  response?: string;
}

export interface TaskLog {
  timestamp: Date;
  level: "info" | "warn" | "error";
  message: string;
  data?: any;
}

export interface AutonomousTaskRequest {
  goal: string;
  context?: Record<string, any>;
  approvalThreshold?: "low" | "medium" | "high";
  maxDuration?: number; // minutes
  notifications?: {
    email?: string;
    webhook?: string;
  };
}

// ============================================
// AUTONOMOUS TASK ENGINE
// ============================================

export class AutonomousTaskEngine extends EventEmitter {
  private tasks: Map<string, AutonomousTask> = new Map();
  private openai: OpenAI;
  private runningTasks: Set<string> = new Set();

  constructor() {
    super();
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /**
   * Create and start autonomous task
   */
  async createTask(
    userId: string,
    request: AutonomousTaskRequest
  ): Promise<AutonomousTask> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const task: AutonomousTask = {
      id: taskId,
      goal: request.goal,
      status: "pending",
      createdAt: new Date(),
      userId,
      context: request.context,
      steps: [],
      decisions: [],
      approvals: [],
      logs: [],
    };

    this.tasks.set(taskId, task);
    this.log(task, "info", `Task created: ${request.goal}`);

    // Start execution asynchronously
    this.executeTask(task, request).catch((error) => {
      this.log(task, "error", `Task execution failed: ${error.message}`);
      task.status = "failed";
      task.error = error.message;
    });

    return task;
  }

  /**
   * Execute autonomous task
   */
  private async executeTask(
    task: AutonomousTask,
    request: AutonomousTaskRequest
  ): Promise<void> {
    try {
      task.status = "running";
      task.startedAt = new Date();
      this.runningTasks.add(task.id);
      this.emit("task-started", task);

      this.log(task, "info", "Analyzing goal and planning steps...");

      // 1. Plan execution steps
      const steps = await this.planSteps(task.goal, task.context);
      task.steps = steps;

      this.log(task, "info", `Planned ${steps.length} steps`);

      // 2. Execute steps sequentially
      for (const step of steps) {
        await this.executeStep(task, step, request);

        // Check if task was cancelled
        if (isCancelledStatus(task.status)) {
          this.log(task, "warn", "Task cancelled by user");
          return;
        }
      }

      // 3. Finalize task
      task.status = "completed";
      task.completedAt = new Date();
      this.runningTasks.delete(task.id);

      this.log(task, "info", "Task completed successfully");
      this.emit("task-completed", task);

      // Send notification
      await this.sendNotification(task, request);
    } catch (error: any) {
      task.status = "failed";
      task.error = error.message;
      this.runningTasks.delete(task.id);

      this.log(task, "error", `Task failed: ${error.message}`);
      this.emit("task-failed", task);

      throw error;
    }
  }

  /**
   * Plan execution steps using AI
   */
  private async planSteps(
    goal: string,
    context?: Record<string, any>
  ): Promise<TaskStep[]> {
    try {
      const prompt = `You are an autonomous task planner. Break down this goal into concrete, executable steps.

Goal: ${goal}

${context ? `Context: ${JSON.stringify(context, null, 2)}` : ""}

Return a JSON array of steps:
[{
  "id": "step-1",
  "description": "detailed step description",
  "requiresApproval": true/false (true if involves money, external services, or sensitive operations)
}]

Make steps specific, actionable, and sequential.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      const stepsData = result.steps || [];

      return stepsData.map((s: any) => ({
        id: s.id,
        description: s.description,
        status: "pending",
        requiresApproval: s.requiresApproval || false,
      }));
    } catch (error) {
      console.error("[AutonomousTask] Step planning failed:", error);
      throw error;
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    task: AutonomousTask,
    step: TaskStep,
    request: AutonomousTaskRequest
  ): Promise<void> {
    step.status = "in-progress";
    step.startedAt = new Date();

    this.log(task, "info", `Executing step: ${step.description}`);
    this.emit("step-started", { task, step });

    try {
      // Check if approval is required
      if (step.requiresApproval) {
        const approved = await this.requestApproval(task, step);

        if (!approved) {
          step.status = "skipped";
          this.log(
            task,
            "warn",
            `Step skipped (not approved): ${step.description}`
          );
          return;
        }
      }

      // Execute step with agent swarm
      const result = await deploySwarm({
        goal: step.description,
        context: {
          mainGoal: task.goal,
          previousSteps: task.steps
            .filter((s) => s.status === "completed")
            .map((s) => ({ description: s.description, output: s.output })),
          ...task.context,
        },
      });

      step.output = result.result;
      step.status = "completed";
      step.completedAt = new Date();

      this.log(task, "info", `Step completed: ${step.description}`);
      this.emit("step-completed", { task, step });
    } catch (error: any) {
      step.status = "failed";
      step.error = error.message;

      this.log(
        task,
        "error",
        `Step failed: ${step.description} - ${error.message}`
      );
      this.emit("step-failed", { task, step });

      throw error;
    }
  }

  /**
   * Request approval for a step
   */
  private async requestApproval(
    task: AutonomousTask,
    step: TaskStep
  ): Promise<boolean> {
    const approval: TaskApproval = {
      id: `approval-${Date.now()}`,
      request: `Approve step: ${step.description}`,
      status: "pending",
      requestedAt: new Date(),
    };

    task.approvals.push(approval);
    task.status = "waiting-approval";

    this.log(task, "info", `Approval requested: ${step.description}`);
    this.emit("approval-requested", { task, approval });

    // Wait for approval (polling - in production use WebSocket)
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (approval.status !== "pending") {
          clearInterval(checkInterval);
          task.status = "running";
          resolve(approval.status === "approved");
        }
      }, 1000);

      // Auto-reject after 1 hour
      setTimeout(() => {
        if (approval.status === "pending") {
          clearInterval(checkInterval);
          approval.status = "rejected";
          approval.respondedAt = new Date();
          task.status = "running";
          resolve(false);
        }
      }, 3_600_000);
    });
  }

  /**
   * Approve or reject a pending approval
   */
  approveTask(
    taskId: string,
    approvalId: string,
    approved: boolean,
    response?: string
  ): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    const approval = task.approvals.find((a) => a.id === approvalId);
    if (!approval || approval.status !== "pending") return;

    approval.status = approved ? "approved" : "rejected";
    approval.respondedAt = new Date();
    approval.response = response;

    this.log(
      task,
      "info",
      `Approval ${approved ? "granted" : "rejected"}: ${approval.request}`
    );
  }

  /**
   * Make an autonomous decision
   */
  private async makeDecision(
    task: AutonomousTask,
    question: string,
    options: string[]
  ): Promise<string> {
    try {
      const prompt = `You are making an autonomous decision for a task.

Task Goal: ${task.goal}
Current Progress: ${task.steps.filter((s) => s.status === "completed").length}/${task.steps.length} steps completed

Question: ${question}
Options: ${options.join(", ")}

Choose the best option and explain your reasoning. Return as JSON:
{
  "chosen": "selected option",
  "reasoning": "why this option is best",
  "confidence": 0.0-1.0
}`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");

      const decision: TaskDecision = {
        id: `decision-${Date.now()}`,
        question,
        options,
        chosen: result.chosen,
        reasoning: result.reasoning,
        confidence: result.confidence,
        timestamp: new Date(),
        autoDecided: true,
      };

      task.decisions.push(decision);
      this.log(task, "info", `Decision made: ${question} → ${result.chosen}`);

      return result.chosen;
    } catch (error) {
      console.error("[AutonomousTask] Decision making failed:", error);
      return options[0]; // Default to first option
    }
  }

  /**
   * Send notification on task completion
   */
  private async sendNotification(
    task: AutonomousTask,
    request: AutonomousTaskRequest
  ): Promise<void> {
    // Placeholder for notification system
    const summary = this.generateTaskSummary(task);

    console.log("[AutonomousTask] Notification:", summary);

    // In production: send email, webhook, etc.
    if (request.notifications?.email) {
      // await sendEmail(request.notifications.email, summary);
    }
  }

  /**
   * Generate task summary
   */
  private generateTaskSummary(task: AutonomousTask): string {
    const duration =
      task.completedAt && task.startedAt
        ? (
            (task.completedAt.getTime() - task.startedAt.getTime()) /
            1000 /
            60
          ).toFixed(1)
        : "?";

    return `
Task Completed: ${task.goal}
Status: ${task.status}
Duration: ${duration} minutes
Steps: ${task.steps.filter((s) => s.status === "completed").length}/${task.steps.length} completed
Decisions Made: ${task.decisions.length}
    `.trim();
  }

  /**
   * Log task activity
   */
  private log(
    task: AutonomousTask,
    level: TaskLog["level"],
    message: string,
    data?: any
  ): void {
    const log: TaskLog = {
      timestamp: new Date(),
      level,
      message,
      data,
    };

    task.logs.push(log);
    console.log(
      `[AutonomousTask] [${task.id}] [${level.toUpperCase()}] ${message}`
    );
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): AutonomousTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Get all tasks for a user
   */
  getUserTasks(userId: string): AutonomousTask[] {
    return Array.from(this.tasks.values()).filter((t) => t.userId === userId);
  }

  /**
   * Cancel a running task
   */
  cancelTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task && task.status === "running") {
      task.status = "cancelled";
      this.runningTasks.delete(taskId);
      this.log(task, "warn", "Task cancelled");
      this.emit("task-cancelled", task);
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let autonomousEngine: AutonomousTaskEngine | null = null;

export function getAutonomousEngine(): AutonomousTaskEngine {
  if (!autonomousEngine) {
    autonomousEngine = new AutonomousTaskEngine();
  }
  return autonomousEngine;
}

export async function createAutonomousTask(
  userId: string,
  request: AutonomousTaskRequest
): Promise<AutonomousTask> {
  const engine = getAutonomousEngine();
  return engine.createTask(userId, request);
}

export function getTaskStatus(taskId: string): AutonomousTask | undefined {
  const engine = getAutonomousEngine();
  return engine.getTask(taskId);
}
