/**
 * AgentOS v1.0 - Agent Router
 * Central routing engine for all agent tasks
 */

import {
  extractEvaluationMetadata,
  logAgentOSEvent,
  logEvaluation,
} from "@/lib/tiqologyDb";
import { canAgentHandleTask, getAgent } from "./registry";
import type {
  AgentOSErrorCode,
  AgentResult,
  AgentTask,
  AgentTrace,
  BuildTaskPayload,
  EvaluationPayload,
  OpsTaskPayload,
} from "./types";

/**
 * Main agent router function
 * Routes tasks to appropriate agents and returns results
 */
export async function routeAgentTask(task: AgentTask): Promise<AgentResult> {
  const trace: AgentTrace = {
    steps: [],
    totalDuration: 0,
    intermediateResults: {},
  };

  const startTime = Date.now();

  try {
    // Validate task
    const validationError = validateTask(task);
    if (validationError) {
      return createErrorResult(
        task.id,
        "validation",
        validationError,
        trace,
        startTime
      );
    }

    trace.steps.push({
      timestamp: Date.now(),
      agent: "router",
      action: "task_validated",
    });

    // Find appropriate agent
    const agentId = selectAgent(task);
    if (!agentId) {
      return createErrorResult(
        task.id,
        agentId || "unknown",
        {
          code: "AGENTOS_AGENT_NOT_FOUND",
          message: `No suitable agent found for kind: ${task.kind}, domain: ${task.domain}`,
        },
        trace,
        startTime
      );
    }

    trace.steps.push({
      timestamp: Date.now(),
      agent: "router",
      action: "agent_selected",
      metadata: { selectedAgent: agentId },
    });

    // Route to specific agent handler
    const result = await executeAgentTask(task, agentId, trace);

    trace.totalDuration = Date.now() - startTime;
    result.trace = trace;

    return result;
  } catch (error) {
    return createErrorResult(
      task.id,
      "router",
      {
        code: "AGENTOS_EXECUTION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        details: { error: String(error) },
      },
      trace,
      startTime
    );
  }
}

/**
 * Validate agent task structure
 */
function validateTask(
  task: AgentTask
): { code: string; message: string } | null {
  if (!task.id) {
    return { code: "AGENTOS_VALIDATION_ERROR", message: "Task ID is required" };
  }
  if (!task.origin) {
    return {
      code: "AGENTOS_VALIDATION_ERROR",
      message: "Task origin is required",
    };
  }
  if (!task.targetAgents || task.targetAgents.length === 0) {
    return {
      code: "AGENTOS_VALIDATION_ERROR",
      message: "At least one target agent is required",
    };
  }
  if (!task.kind) {
    return {
      code: "AGENTOS_VALIDATION_ERROR",
      message: "Task kind is required",
    };
  }
  if (!task.domain) {
    return {
      code: "AGENTOS_VALIDATION_ERROR",
      message: "Task domain is required",
    };
  }
  if (!task.payload) {
    return {
      code: "AGENTOS_VALIDATION_ERROR",
      message: "Task payload is required",
    };
  }
  return null;
}

/**
 * Select appropriate agent for task
 */
function selectAgent(task: AgentTask): string | null {
  // Try target agents in order
  for (const agentId of task.targetAgents) {
    if (canAgentHandleTask(agentId, task.kind, task.domain)) {
      return agentId;
    }
  }
  return null;
}

/**
 * Execute task with selected agent
 */
async function executeAgentTask(
  task: AgentTask,
  agentId: string,
  trace: AgentTrace
): Promise<AgentResult> {
  const agentStartTime = Date.now();

  trace.steps.push({
    timestamp: agentStartTime,
    agent: agentId,
    action: "execution_started",
  });

  try {
    let result: AgentResult;

    // Route to specific agent implementation
    switch (agentId) {
      case "ghost-evaluator":
        result = await executeGhostEvaluator(task, trace);
        break;

      case "best-interest-engine":
        result = await executeBestInterestEngine(task, trace);
        break;

      case "devin-builder":
        result = await executeDevinBuilder(task, trace);
        break;

      case "rocket-ops":
        result = await executeRocketOps(task, trace);
        break;

      default:
        throw new Error(`Agent implementation not found: ${agentId}`);
    }

    const duration = Date.now() - agentStartTime;
    trace.steps.push({
      timestamp: Date.now(),
      agent: agentId,
      action: "execution_completed",
      duration,
    });

    return result;
  } catch (error) {
    const duration = Date.now() - agentStartTime;
    trace.steps.push({
      timestamp: Date.now(),
      agent: agentId,
      action: "execution_failed",
      duration,
      metadata: { error: String(error) },
    });
    throw error;
  }
}

/**
 * Execute Ghost evaluator agent
 */
async function executeGhostEvaluator(
  task: AgentTask,
  trace: AgentTrace
): Promise<AgentResult> {
  if (!task.payload || typeof (task.payload as any).prompt !== "string") {
    throw new Error(
      "Invalid EvaluationPayload: missing required 'prompt' property."
    );
  }
  const payload = task.payload as unknown as EvaluationPayload;

  // Call Ghost API internally
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ghost`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: payload.prompt,
        context: payload.context,
        model: payload.model || "chat-model",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Ghost API request failed");
  }

  const ghostResult = await response.json();

  trace.intermediateResults = { ghostResponse: ghostResult };

  // Extract metadata for logging
  const { orgId, caseId, userId } = extractEvaluationMetadata(task);

  // Log evaluation to TiQology Core DB
  const logResult = await logEvaluation({
    orgId: orgId || "unknown",
    caseId,
    evaluatorUserId: userId,
    evaluationType: "ghost",
    modelFlavor: payload.model === "chat-model-reasoning" ? "deep" : "fast",
    overallScore: ghostResult.score,
    summary: ghostResult.feedback,
    rawRequest: { task, payload },
    rawResponse: ghostResult,
  });

  // Log AgentOS event
  await logAgentOSEvent({
    eventType: "evaluation_run",
    agentId: "ghost-evaluator",
    taskId: task.id,
    orgId,
    caseId,
    userId,
    status: "completed",
    metadata: { score: ghostResult.score, model: payload.model },
  });

  return {
    taskId: task.id,
    agentId: "ghost-evaluator",
    status: "completed",
    result: {
      data: {
        score: ghostResult.score,
        feedback: ghostResult.feedback,
        fullResponse: ghostResult.result,
        model: ghostResult.model,
        evaluationId: logResult.evaluationId,
      },
      summary: `Evaluation completed with score: ${ghostResult.score}`,
      confidence: ghostResult.score / 100,
    },
    trace,
    completedAt: Date.now(),
    ...(logResult.loggingError && { loggingError: logResult.loggingError }),
  };
}

/**
 * Execute Best Interest Engine agent
 */
async function executeBestInterestEngine(
  task: AgentTask,
  trace: AgentTrace
): Promise<AgentResult> {
  const payload = task.payload as any; // BestInterestPayload

  // Build Best Interest prompt
  const prompt = buildBestInterestPrompt(payload);

  // Call Ghost API with specialized prompt
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/ghost`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        model: payload.model || "chat-model",
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Best Interest API request failed");
  }

  const ghostResult = await response.json();

  // Parse Best Interest scores from response
  const scores = parseBestInterestScores(ghostResult.result);

  trace.intermediateResults = {
    ghostResponse: ghostResult,
    parsedScores: scores,
  };

  // Extract metadata for logging
  const { orgId, caseId, userId } = extractEvaluationMetadata(task);

  // Log evaluation to TiQology Core DB
  const logResult = await logEvaluation({
    orgId: orgId || "unknown",
    caseId,
    evaluatorUserId: userId,
    evaluationType: "best_interest",
    modelFlavor: payload.model === "chat-model-reasoning" ? "deep" : "fast",
    overallScore: scores.overall,
    summary: scores.summary || `Overall: ${scores.overall}/100`,
    dimensions: [
      {
        dimensionName: "Stability",
        score: scores.stability,
        reasoning: scores.stabilityReasoning,
      },
      {
        dimensionName: "Emotional",
        score: scores.emotional,
        reasoning: scores.emotionalReasoning,
      },
      {
        dimensionName: "Safety",
        score: scores.safety,
        reasoning: scores.safetyReasoning,
      },
      {
        dimensionName: "Development",
        score: scores.development,
        reasoning: scores.developmentReasoning,
      },
    ],
    rawRequest: { task, payload },
    rawResponse: { ghostResult, scores },
  });

  // Log AgentOS event
  await logAgentOSEvent({
    eventType: "evaluation_run",
    agentId: "best-interest-engine",
    taskId: task.id,
    orgId,
    caseId,
    userId,
    status: "completed",
    metadata: { overallScore: scores.overall, model: payload.model },
  });

  return {
    taskId: task.id,
    agentId: "best-interest-engine",
    status: "completed",
    result: {
      data: {
        ...scores,
        evaluationId: logResult.evaluationId,
      },
      summary: `Best Interest evaluation completed. Overall score: ${scores.overall}`,
      confidence: scores.overall / 100,
    },
    trace,
    completedAt: Date.now(),
    ...(logResult.loggingError && { loggingError: logResult.loggingError }),
  };
}

/**
 * Execute Devin builder agent (human-in-the-loop)
 */
async function executeDevinBuilder(
  task: AgentTask,
  trace: AgentTrace
): Promise<AgentResult> {
  if (
    !task.payload ||
    typeof (task.payload as any).description !== "string" ||
    !Array.isArray((task.payload as any).requirements)
  ) {
    throw new Error(
      "Invalid BuildTaskPayload: missing required 'description' (string) or 'requirements' (string[]) property."
    );
  }
  const payload = task.payload as unknown as BuildTaskPayload;

  // Generate Rocket-Devin TASK template
  const taskTemplate = generateRocketDevinTask(payload);

  trace.intermediateResults = { taskTemplate };

  return {
    taskId: task.id,
    agentId: "devin-builder",
    status: "completed",
    result: {
      data: {
        taskTemplate,
        templateFormat: "rocket-devin-markdown",
        requiresHumanApproval: true,
      },
      summary: "Build task template generated. Human review required.",
    },
    trace,
    completedAt: Date.now(),
  };
}

/**
 * Execute Rocket ops agent (human-in-the-loop)
 */
async function executeRocketOps(
  task: AgentTask,
  trace: AgentTrace
): Promise<AgentResult> {
  if (
    !task.payload ||
    typeof (task.payload as any).action !== "string" ||
    typeof (task.payload as any).target !== "string" ||
    typeof (task.payload as any).parameters !== "object"
  ) {
    throw new Error(
      "Invalid OpsTaskPayload: missing required 'action' (string), 'target' (string), or 'parameters' (object) property."
    );
  }
  const payload = task.payload as unknown as OpsTaskPayload;

  // Generate Rocket ops playbook
  const playbook = generateRocketOpsPlaybook(payload);

  trace.intermediateResults = { playbook };

  return {
    taskId: task.id,
    agentId: "rocket-ops",
    status: "completed",
    result: {
      data: {
        playbook,
        action: payload.action,
        target: payload.target,
        requiresHumanApproval: true,
      },
      summary: `Ops playbook generated for ${payload.action} on ${payload.target}. Human review required.`,
    },
    trace,
    completedAt: Date.now(),
  };
}

/**
 * Build Best Interest evaluation prompt
 */
function buildBestInterestPrompt(payload: any): string {
  return `You are the Best Interest Evaluation Engine v1.0, designed to analyze parenting situations using a neutral, court-aligned scoring system.

Evaluate using these 4 categories (0-100):
1. STABILITY (consistency, routines, reliability)
2. SAFETY (physical safety, supervision, conflict levels)
3. COOPERATION (communication, coordination, flexibility)
4. EMOTIONAL IMPACT (child's well-being, parental support)

CASE INFORMATION:
Parenting Plan: ${payload.parentingPlan || "Not provided"}
Communication: ${payload.communication || "Not provided"}
Incidents: ${payload.incidents || "Not provided"}
Child Profile: ${payload.childProfile || "Not provided"}

Respond in JSON format:
{
  "stability_score": 0-100,
  "safety_score": 0-100,
  "cooperation_score": 0-100,
  "emotional_impact_score": 0-100,
  "overall_score": 0-100,
  "summary": "overall narrative",
  "concerns": ["list of concerns"],
  "recommendations": ["list of recommendations"]
}`;
}

/**
 * Parse Best Interest scores from AI response
 */
function parseBestInterestScores(response: string): any {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        stability: parsed.stability_score || 0,
        safety: parsed.safety_score || 0,
        cooperation: parsed.cooperation_score || 0,
        emotionalImpact: parsed.emotional_impact_score || 0,
        overall: parsed.overall_score || 0,
        summary: parsed.summary || "",
        concerns: parsed.concerns || [],
        recommendations: parsed.recommendations || [],
      };
    }
  } catch (error) {
    console.error("Failed to parse Best Interest scores:", error);
  }

  // Fallback to basic score extraction
  return {
    stability: 50,
    safety: 50,
    cooperation: 50,
    emotionalImpact: 50,
    overall: 50,
    summary: response,
    concerns: [],
    recommendations: [],
  };
}

/**
 * Generate Rocket-Devin task template
 */
function generateRocketDevinTask(payload: BuildTaskPayload): string {
  return `# 🚀 ROCKET-DEVIN BUILD TASK

## Task Overview
${payload.description}

## Requirements
${payload.requirements.map((req, i) => `${i + 1}. ${req}`).join("\n")}

## Context
${payload.context || "No additional context provided"}

## Priority
${payload.priority?.toUpperCase() || "MEDIUM"}

## Target Repository
${payload.targetRepo || "TBD"}

## Acceptance Criteria
- [ ] All requirements implemented
- [ ] Code passes TypeScript compilation
- [ ] Tests added and passing
- [ ] Documentation updated
- [ ] PR created and reviewed

## Next Steps
1. Review requirements with team
2. Break down into subtasks
3. Implement and test
4. Submit for review

---
*Generated by AgentOS v1.0 - Devin Builder Agent*
*Timestamp: ${new Date().toISOString()}*
`;
}

/**
 * Generate Rocket ops playbook
 */
function generateRocketOpsPlaybook(payload: OpsTaskPayload): string {
  return `# 🚀 ROCKET OPS PLAYBOOK

## Action: ${payload.action.toUpperCase()}
**Target**: ${payload.target}

## Parameters
\`\`\`json
${JSON.stringify(payload.parameters, null, 2)}
\`\`\`

## Pre-flight Checklist
- [ ] Environment variables configured
- [ ] Backup completed (if applicable)
- [ ] Team notified
- [ ] Monitoring alerts configured

## Execution Steps
${generateOpsSteps(payload.action)}

## Rollback Procedure
${generateRollbackSteps(payload.action)}

## Verification
- [ ] Service health check passed
- [ ] Metrics within normal range
- [ ] Error rates acceptable
- [ ] User-facing functionality verified

## Runbook Reference
${payload.runbook || "No runbook specified"}

---
*Generated by AgentOS v1.0 - Rocket Ops Agent*
*Timestamp: ${new Date().toISOString()}*
`;
}

/**
 * Generate ops execution steps
 */
function generateOpsSteps(action: string): string {
  const steps: Record<string, string[]> = {
    deploy: [
      "1. Pull latest code from repository",
      "2. Run build process",
      "3. Run automated tests",
      "4. Deploy to staging environment",
      "5. Verify staging deployment",
      "6. Deploy to production with blue-green strategy",
      "7. Monitor error rates and performance",
    ],
    config: [
      "1. Review current configuration",
      "2. Prepare new configuration files",
      "3. Validate configuration syntax",
      "4. Apply to non-production environment first",
      "5. Test configuration changes",
      "6. Apply to production",
      "7. Verify application behavior",
    ],
    monitor: [
      "1. Set up monitoring dashboards",
      "2. Configure alert thresholds",
      "3. Set up notification channels",
      "4. Test alert firing",
      "5. Document alert response procedures",
    ],
    rollback: [
      "1. Identify last known good version",
      "2. Notify team of rollback",
      "3. Execute rollback procedure",
      "4. Verify service restoration",
      "5. Investigate root cause",
    ],
    scale: [
      "1. Analyze current resource usage",
      "2. Calculate required capacity",
      "3. Update scaling configuration",
      "4. Apply scaling changes",
      "5. Monitor resource allocation",
      "6. Verify service performance",
    ],
  };

  return (steps[action] || ["1. Execute action", "2. Verify results"]).join(
    "\n"
  );
}

/**
 * Generate rollback steps
 */
function generateRollbackSteps(action: string): string {
  const steps: Record<string, string[]> = {
    deploy: [
      "1. Identify previous stable version",
      "2. Deploy previous version",
      "3. Verify rollback success",
    ],
    config: [
      "1. Restore previous configuration",
      "2. Restart affected services",
      "3. Verify configuration restore",
    ],
    monitor: ["1. Disable new alerts", "2. Restore previous monitoring setup"],
    scale: [
      "1. Revert to previous scale settings",
      "2. Monitor resource stabilization",
    ],
  };

  return (
    steps[action] || ["1. Revert changes", "2. Verify system state"]
  ).join("\n");
}

/**
 * Create error result
 */
function createErrorResult(
  taskId: string,
  agentId: string,
  error: { code: string; message: string; details?: any },
  trace: AgentTrace,
  startTime: number
): AgentResult {
  trace.totalDuration = Date.now() - startTime;

  return {
    taskId,
    agentId,
    status: "failed",
    error,
    trace,
    completedAt: Date.now(),
  };
}
