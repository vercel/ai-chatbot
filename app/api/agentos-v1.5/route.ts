/**
 * AgentOS v1.5 - Enhanced Agent Router API
 * Multi-agent orchestration with pipelines, memory, and security
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { 
  loadPipeline, 
  executePipeline, 
  getPipelineExecution,
  type PipelineExecutionResult 
} from '@/lib/agentos/pipelineExecutor';
import { 
  loadSessionContext, 
  processMemoryUpdates,
  type MemoryContext 
} from '@/lib/agentos/memoryService';
import { 
  trustShieldPreProcess, 
  type SecurityCheckResult 
} from '@/lib/agentos/trustShield';
import { 
  getAgentById, 
  getAllAgents,
  type UserRole 
} from '@/lib/agentos/agentRegistry';
import { getTiqologyDb } from '@/lib/tiqologyDb';

export const runtime = 'edge';
export const maxDuration = 60;

// ============================================
// TYPES
// ============================================

interface AgentOSRequest {
  // v1.5: Pipeline execution
  pipelineId?: string;
  
  // v1.0: Single agent execution (legacy)
  agentId?: string;
  mode?: 'fast' | 'deep' | 'batch';
  
  // User context
  userId?: string | null;
  userRole?: UserRole;
  sessionKey?: string;
  
  // Input
  input: string | Record<string, any>;
  
  // Memory
  loadMemory?: boolean;
  saveMemory?: boolean;
  
  // Metadata
  domain?: string;
  appId?: string;
}

interface AgentOSResponse {
  // Execution tracking
  executionId?: string;
  pipelineId?: string;
  agentId?: string;
  
  // Results
  status: 'success' | 'error' | 'timeout' | 'blocked';
  result?: any;
  resultsByStep?: any[];
  summary?: string;
  
  // Security
  securityCheck?: SecurityCheckResult;
  
  // Memory
  memoryContext?: MemoryContext;
  memoriesSaved?: number;
  
  // Telemetry
  telemetryId?: string;
  durationMs?: number;
  
  // Error
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================
// POST: Execute Pipeline or Agent
// ============================================

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const supabase = getTiqologyDb();
  
  try {
    // Parse request
    const body: AgentOSRequest = await req.json();
    
    const {
      pipelineId,
      agentId,
      mode = 'fast',
      userId = null,
      userRole = 'user',
      sessionKey = `session_${Date.now()}`,
      input,
      loadMemory = true,
      saveMemory = true,
      domain = 'general',
      appId = 'tiqology-spa',
    } = body;
    
    // Validate: Must have either pipelineId or agentId
    if (!pipelineId && !agentId) {
      return NextResponse.json(
        {
          status: 'error',
          error: {
            code: 'AGENTOS_VALIDATION_ERROR',
            message: 'Must provide either pipelineId or agentId',
          },
        } as AgentOSResponse,
        { status: 400 }
      );
    }
    
    // Extract input text for security check
    const inputText = typeof input === 'string' ? input : JSON.stringify(input);
    
    // TrustShield: Pre-processing security check
    const targetAgentId = pipelineId ? 'pipeline' : agentId!;
    const securityCheck = await trustShieldPreProcess(
      inputText,
      userId,
      sessionKey,
      targetAgentId,
      userRole
    );
    
    if (!securityCheck.allowed) {
      // Log blocked request
      await supabase.from('agentos_event_log').insert({
        user_id: userId,
        agent_id: targetAgentId,
        event_type: 'request_blocked',
        app_id: appId,
        score: securityCheck.riskScore,
        status: 'error',
        metadata: {
          reason: securityCheck.reason,
          flags: securityCheck.flags,
        },
      });
      
      return NextResponse.json(
        {
          status: 'blocked',
          securityCheck,
          error: {
            code: 'AGENTOS_SECURITY_BLOCKED',
            message: securityCheck.reason || 'Request blocked by security check',
            details: { flags: securityCheck.flags },
          },
        } as AgentOSResponse,
        { status: 403 }
      );
    }
    
    // Use sanitized input if available
    const safeInput = securityCheck.sanitizedInput || input;
    
    // Memory Layer: Load session context
    let memoryContext: MemoryContext | undefined;
    if (loadMemory) {
      try {
        memoryContext = await loadSessionContext(sessionKey, userId, domain);
        console.log(`[AgentOS] Loaded ${memoryContext.memories.length} memories for session`);
      } catch (error) {
        console.error('[AgentOS] Error loading memory context:', error);
        // Continue without memory
      }
    }
    
    // Execute pipeline or single agent
    let result: PipelineExecutionResult | any;
    let telemetryId: string | undefined;
    
    if (pipelineId) {
      // Execute multi-agent pipeline
      console.log(`[AgentOS] Executing pipeline: ${pipelineId}`);
      
      const pipelineResult = await executePipeline(
        pipelineId,
        userId,
        userRole,
        memoryContext?.sessionId || null,
        typeof safeInput === 'string' ? { prompt: safeInput } : safeInput,
        memoryContext ? {
          memories: memoryContext.memories,
          summary: memoryContext.summary,
        } : undefined
      );
      
      result = pipelineResult;
      telemetryId = pipelineResult.executionId;
      
      // Process memory updates from pipeline steps
      if (saveMemory && memoryContext) {
        let memoriesSaved = 0;
        
        for (const step of pipelineResult.resultsByStep) {
          if (step.result?.memoryUpdates) {
            await processMemoryUpdates(
              memoryContext.sessionId,
              step.agentId,
              step.result.memoryUpdates
            );
            memoriesSaved += step.result.memoryUpdates.length;
          }
        }
        
        console.log(`[AgentOS] Saved ${memoriesSaved} memories from pipeline`);
      }
      
      // Log to telemetry
      await supabase.from('agentos_event_log').insert({
        user_id: userId,
        agent_id: 'pipeline',
        pipeline_id: pipelineId,
        pipeline_execution_id: telemetryId,
        event_type: 'pipeline_executed',
        app_id: appId,
        score: pipelineResult.status === 'success' ? 100 : 0,
        duration_ms: pipelineResult.durationMs,
        status: pipelineResult.status,
        metadata: {
          stepsCompleted: pipelineResult.stepsCompleted,
          totalSteps: pipelineResult.totalSteps,
        },
      });
      
      return NextResponse.json({
        status: result.status,
        executionId: result.executionId,
        pipelineId: result.pipelineId,
        resultsByStep: result.resultsByStep,
        summary: result.overallSummary,
        securityCheck: securityCheck.flags.length > 0 ? securityCheck : undefined,
        memoryContext: loadMemory ? memoryContext : undefined,
        telemetryId,
        durationMs: result.durationMs,
      } as AgentOSResponse);
      
    } else {
      // Execute single agent (v1.0 legacy mode)
      console.log(`[AgentOS] Executing single agent: ${agentId}`);
      
      const agent = await getAgentById(agentId!);
      if (!agent) {
        return NextResponse.json(
          {
            status: 'error',
            error: {
              code: 'AGENTOS_AGENT_NOT_FOUND',
              message: `Agent '${agentId}' not found`,
            },
          } as AgentOSResponse,
          { status: 404 }
        );
      }
      
      // TODO: Call actual agent implementation
      // For now, return mock response
      result = {
        agentId: agent.id,
        agentName: agent.name,
        mode,
        status: 'success',
        response: 'Mock response from agent (TODO: integrate actual agent logic)',
        input: safeInput,
        memoryContext: memoryContext?.summary,
      };
      
      // Log to telemetry
      const { data: logData } = await supabase.from('agentos_event_log')
        .insert({
          user_id: userId,
          agent_id: agentId,
          event_type: 'agent_executed',
          app_id: appId,
          score: 100,
          duration_ms: Date.now() - startTime,
          status: 'success',
        })
        .select('id')
        .single();
      
      telemetryId = logData?.id;
      
      return NextResponse.json({
        status: 'success',
        agentId: agent.id,
        result,
        securityCheck: securityCheck.flags.length > 0 ? securityCheck : undefined,
        memoryContext: loadMemory ? memoryContext : undefined,
        telemetryId,
        durationMs: Date.now() - startTime,
      } as AgentOSResponse);
    }
    
  } catch (error: any) {
    console.error('[AgentOS] Execution error:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        error: {
          code: 'AGENTOS_EXECUTION_ERROR',
          message: error.message || 'Internal server error',
          details: { stack: error.stack },
        },
        durationMs: Date.now() - startTime,
      } as AgentOSResponse,
      { status: 500 }
    );
  }
}

// ============================================
// GET: Service Info & Health
// ============================================

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const executionId = url.searchParams.get('executionId');
    
    // If executionId provided, return execution result
    if (executionId) {
      const execution = await getPipelineExecution(executionId);
      
      if (!execution) {
        return NextResponse.json(
          {
            error: {
              code: 'AGENTOS_NOT_FOUND',
              message: `Execution '${executionId}' not found`,
            },
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        execution,
      });
    }
    
    // Otherwise, return service info
    const agents = await getAllAgents();
    
    return NextResponse.json({
      status: 'healthy',
      service: 'agentos-v1.5',
      version: '1.5.0',
      description: 'Multi-agent orchestration with pipelines, memory, and security',
      
      features: [
        'Agent Registry: 8 specialized agents',
        'Pipeline Engine: Multi-step orchestration with conditionals',
        'Memory Layer: Session-based context retention',
        'Telemetry: Real-time analytics and monitoring',
        'TrustShield: Pre-processing security layer',
      ],
      
      endpoints: {
        'POST /api/agent-router': {
          description: 'Execute pipeline or single agent',
          requiredFields: ['input', 'pipelineId OR agentId'],
          optionalFields: ['userId', 'userRole', 'sessionKey', 'loadMemory', 'saveMemory', 'domain', 'appId'],
          example: {
            pipelineId: 'best-interest-full-eval',
            userId: 'user_123',
            userRole: 'pro',
            sessionKey: 'session_abc',
            input: { prompt: 'Review this contract...', context: {} },
            loadMemory: true,
            saveMemory: true,
          },
        },
        'GET /api/agent-router?executionId=<id>': {
          description: 'Get pipeline execution result',
        },
        'GET /api/agent-router': {
          description: 'Service health and info',
        },
      },
      
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        domain: a.domain,
        modes: a.modes,
        costScore: a.costScore,
        latencyScore: a.latencyScore,
        minRole: a.minRole,
      })),
      
      stats: {
        totalAgents: agents.length,
        domains: [...new Set(agents.map(a => a.domain))],
      },
    });
    
  } catch (error: any) {
    console.error('[AgentOS] GET error:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'AGENTOS_ERROR',
          message: error.message,
        },
      },
      { status: 500 }
    );
  }
}
