/**
 * AgentOS v1.0 - Agent Router API Endpoint
 * Central HTTP endpoint for all agent task routing
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { routeAgentTask } from '@/lib/agentos/router';
import type { AgentTask } from '@/lib/agentos/types';

export const runtime = 'edge';
export const maxDuration = 60;

/**
 * POST /api/agent-router
 * 
 * Route agent tasks to appropriate handlers
 * 
 * Request body:
 * {
 *   "task": AgentTask
 * }
 * 
 * Response:
 * {
 *   "taskId": string,
 *   "result": AgentResult,
 *   "trace": AgentTrace
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { task } = body;

    // Validate task presence
    if (!task) {
      return NextResponse.json(
        {
          error: {
            code: 'AGENTOS_VALIDATION_ERROR',
            message: 'Missing required field: task',
          },
        },
        { status: 400 }
      );
    }

    // Validate basic task structure
    const validationErrors = validateTaskStructure(task);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'AGENTOS_VALIDATION_ERROR',
            message: 'Task validation failed',
            details: { errors: validationErrors },
          },
        },
        { status: 400 }
      );
    }

    // Optional: Validate API key for external requests
    const apiKey = req.headers.get('x-api-key');
    const expectedKey = process.env.AGENTOS_API_KEY;
    
    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json(
        {
          error: {
            code: 'AGENTOS_AUTHENTICATION_ERROR',
            message: 'Invalid or missing API key',
          },
        },
        { status: 401 }
      );
    }

    // Set defaults if not provided
    const agentTask: AgentTask = {
      ...task,
      id: task.id || generateTaskId(),
      createdAt: task.createdAt || Date.now(),
      priority: task.priority || 'normal',
      metadata: task.metadata || {},
    };

    // Route task to appropriate agent
    const result = await routeAgentTask(agentTask);

    // Check for errors in result
    if (result.status === 'failed' && result.error) {
      const statusCode = getStatusCodeForError(result.error.code);
      return NextResponse.json(
        {
          taskId: result.taskId,
          error: result.error,
          trace: result.trace,
        },
        { status: statusCode }
      );
    }

    // Return successful result
    return NextResponse.json({
      taskId: result.taskId,
      result: result.result,
      trace: result.trace,
      status: result.status,
      completedAt: result.completedAt,
    });

  } catch (error) {
    console.error('AgentOS Router Error:', error);

    return NextResponse.json(
      {
        error: {
          code: 'AGENTOS_ROUTING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: { error: String(error) },
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent-router
 * 
 * Health check and service info
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'agentos-router',
    version: '1.0.0',
    description: 'Multi-agent orchestration layer for TiQology',
    endpoints: {
      POST: {
        description: 'Route agent tasks',
        requiredFields: ['task.id', 'task.origin', 'task.targetAgents', 'task.kind', 'task.domain', 'task.payload'],
      },
      GET: {
        description: 'Health check and service info',
      },
    },
    availableAgents: [
      'ghost-evaluator',
      'best-interest-engine',
      'devin-builder',
      'rocket-ops',
    ],
  });
}

/**
 * Validate task structure
 */
function validateTaskStructure(task: any): string[] {
  const errors: string[] = [];

  if (!task.origin || typeof task.origin !== 'string') {
    errors.push('task.origin must be a non-empty string');
  }

  if (!Array.isArray(task.targetAgents) || task.targetAgents.length === 0) {
    errors.push('task.targetAgents must be a non-empty array');
  }

  if (!task.kind || typeof task.kind !== 'string') {
    errors.push('task.kind must be a non-empty string');
  }

  if (!task.domain || typeof task.domain !== 'string') {
    errors.push('task.domain must be a non-empty string');
  }

  if (!task.payload || typeof task.payload !== 'object') {
    errors.push('task.payload must be an object');
  }

  return errors;
}

/**
 * Generate unique task ID
 */
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Map error codes to HTTP status codes
 */
function getStatusCodeForError(errorCode: string): number {
  const errorMap: Record<string, number> = {
    AGENTOS_VALIDATION_ERROR: 400,
    AGENTOS_AUTHENTICATION_ERROR: 401,
    AGENTOS_AGENT_NOT_FOUND: 404,
    AGENTOS_TIMEOUT_ERROR: 408,
    AGENTOS_RATE_LIMIT_ERROR: 429,
    AGENTOS_ROUTING_ERROR: 500,
    AGENTOS_EXECUTION_ERROR: 500,
  };

  return errorMap[errorCode] || 500;
}
