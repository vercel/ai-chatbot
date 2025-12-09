/**
 * AgentOS v1.5 - Pipeline Executor
 * Multi-agent orchestration with conditional logic
 */

import { getTiqologyDb } from '../tiqologyDb';
import { getAgentById, isAgentEnabledForRole, type Agent, type UserRole } from './agentRegistry';
import { v4 as uuidv4 } from 'uuid';

// ============================================
// TYPES
// ============================================

export interface PipelineStep {
  agentId: string;
  mode?: 'fast' | 'deep' | 'batch';
  input?: Record<string, any>;
  saveAs?: string; // Variable name to save result
  type?: 'conditional'; // For conditional steps
  if?: string; // Condition expression (e.g., "ghostCheck.score < 60")
  then?: PipelineStep[];
  else?: PipelineStep[];
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  steps: PipelineStep[];
  enabled: boolean;
  minRole: UserRole;
  version: number;
  metadata: Record<string, any>;
}

export interface PipelineExecutionContext {
  pipelineId: string;
  userId: string | null;
  sessionId: string | null;
  userRole: UserRole;
  initialInput: Record<string, any>;
  variables: Record<string, any>; // Intermediate results
  memoryContext?: Record<string, any>; // From Memory Layer
}

export interface StepResult {
  stepIndex: number;
  agentId: string;
  mode: string;
  status: 'success' | 'error' | 'skipped' | 'timeout';
  result: any;
  error?: string;
  durationMs: number;
  timestamp: string;
}

export interface PipelineExecutionResult {
  executionId: string;
  pipelineId: string;
  status: 'success' | 'error' | 'timeout' | 'cancelled';
  stepsCompleted: number;
  totalSteps: number;
  resultsByStep: StepResult[];
  overallSummary: string;
  durationMs: number;
  startedAt: string;
  completedAt: string;
}

// ============================================
// PIPELINE LOADING
// ============================================

/**
 * Load pipeline from database
 */
export async function loadPipeline(pipelineId: string): Promise<Pipeline | null> {
  const supabase = getTiqologyDb();
  
  const { data, error } = await supabase
    .from('tiq_pipelines')
    .select('*')
    .eq('id', pipelineId)
    .single();

  if (error || !data) {
    console.error('[PipelineExecutor] Error loading pipeline:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    steps: data.steps as PipelineStep[],
    enabled: data.enabled,
    minRole: data.min_role as UserRole,
    version: data.version,
    metadata: data.metadata || {},
  };
}

/**
 * Get pipelines by domain
 */
export async function getPipelinesByDomain(domain: string): Promise<Pipeline[]> {
  const supabase = getTiqologyDb();
  
  const { data: pipelines, error } = await supabase
    .rpc('get_pipelines_by_domain', { p_domain: domain });

  if (error) {
    console.error('[PipelineExecutor] Error loading pipelines:', error);
    return [];
  }

  return (pipelines || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    steps: p.steps,
    enabled: p.enabled,
    minRole: p.min_role,
    version: p.version,
    metadata: p.metadata || {},
  }));
}

// ============================================
// CONDITIONAL LOGIC
// ============================================

/**
 * Evaluate conditional expression
 * Supports simple comparisons: score < 60, status === "approved", etc.
 */
function evaluateCondition(condition: string, context: Record<string, any>): boolean {
  try {
    // Simple expression parser
    // Format: "variableName.property operator value"
    // Example: "ghostCheck.score < 60"
    
    const operatorRegex = /(<=|>=|<|>|===|!==|==|!=)/;
    const match = condition.match(operatorRegex);
    
    if (!match) {
      console.warn('[PipelineExecutor] Invalid condition format:', condition);
      return false;
    }
    
    const operator = match[1];
    const parts = condition.split(operator).map(s => s.trim());
    
    if (parts.length !== 2) {
      return false;
    }
    
    // Resolve left side (e.g., "ghostCheck.score")
    const leftValue = resolveVariable(parts[0], context);
    
    // Resolve right side (convert string to number/boolean if needed)
    let rightValue: any = parts[1];
    if (rightValue === 'true') rightValue = true;
    else if (rightValue === 'false') rightValue = false;
    else if (!isNaN(Number(rightValue))) rightValue = Number(rightValue);
    else rightValue = rightValue.replace(/['"]/g, ''); // Remove quotes
    
    // Evaluate
    switch (operator) {
      case '<': return leftValue < rightValue;
      case '>': return leftValue > rightValue;
      case '<=': return leftValue <= rightValue;
      case '>=': return leftValue >= rightValue;
      case '===': return leftValue === rightValue;
      case '!==': return leftValue !== rightValue;
      case '==': return leftValue == rightValue;
      case '!=': return leftValue != rightValue;
      default: return false;
    }
  } catch (error) {
    console.error('[PipelineExecutor] Error evaluating condition:', error);
    return false;
  }
}

/**
 * Resolve variable from context (supports dot notation)
 */
function resolveVariable(path: string, context: Record<string, any>): any {
  const parts = path.split('.');
  let value: any = context;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in value) {
      value = value[part];
    } else {
      return undefined;
    }
  }
  
  return value;
}

// ============================================
// AGENT EXECUTION (Mock - Replace with actual AgentOS routing)
// ============================================

/**
 * Execute a single agent step
 * TODO: Replace with actual AgentOS routing logic
 */
async function executeAgentStep(
  agent: Agent,
  mode: string,
  input: Record<string, any>,
  context: PipelineExecutionContext
): Promise<any> {
  const startTime = Date.now();
  
  try {
    // TODO: Call actual agent via AgentOS router
    // For now, mock response
    console.log(`[PipelineExecutor] Executing ${agent.id} in ${mode} mode...`);
    
    // Simulate latency based on agent's latency score
    const latencyMs = agent.latencyScore * 100;
    await new Promise(resolve => setTimeout(resolve, latencyMs));
    
    // Mock response structure
    const mockResponse = {
      agentId: agent.id,
      mode,
      status: 'success',
      score: Math.floor(Math.random() * 100),
      summary: `Mock response from ${agent.name}`,
      details: input,
      durationMs: Date.now() - startTime,
    };
    
    return mockResponse;
  } catch (error) {
    console.error(`[PipelineExecutor] Error executing ${agent.id}:`, error);
    throw error;
  }
}

// ============================================
// PIPELINE EXECUTION
// ============================================

/**
 * Execute pipeline steps recursively
 */
async function executeSteps(
  steps: PipelineStep[],
  context: PipelineExecutionContext,
  stepResults: StepResult[]
): Promise<void> {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepStartTime = Date.now();
    
    // Handle conditional steps
    if (step.type === 'conditional') {
      if (!step.if) {
        console.warn('[PipelineExecutor] Conditional step missing "if" clause');
        continue;
      }
      
      const conditionMet = evaluateCondition(step.if, context.variables);
      
      console.log(`[PipelineExecutor] Condition "${step.if}" = ${conditionMet}`);
      
      if (conditionMet && step.then) {
        await executeSteps(step.then, context, stepResults);
      } else if (!conditionMet && step.else) {
        await executeSteps(step.else, context, stepResults);
      }
      
      continue;
    }
    
    // Regular agent step
    const { agentId, mode = 'fast', input = {}, saveAs } = step;
    
    // Load agent
    const agent = await getAgentById(agentId);
    if (!agent) {
      stepResults.push({
        stepIndex: stepResults.length,
        agentId,
        mode,
        status: 'error',
        result: null,
        error: `Agent '${agentId}' not found`,
        durationMs: Date.now() - stepStartTime,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Agent '${agentId}' not found`);
    }
    
    // Check permissions
    const hasPermission = await isAgentEnabledForRole(agentId, context.userRole);
    if (!hasPermission) {
      stepResults.push({
        stepIndex: stepResults.length,
        agentId,
        mode,
        status: 'error',
        result: null,
        error: `User role '${context.userRole}' cannot access agent '${agentId}'`,
        durationMs: Date.now() - stepStartTime,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Permission denied for agent '${agentId}'`);
    }
    
    // Merge input with context variables
    const mergedInput = {
      ...context.initialInput,
      ...input,
      ...context.variables,
      memoryContext: context.memoryContext,
    };
    
    // Execute agent
    try {
      const result = await executeAgentStep(agent, mode, mergedInput, context);
      
      // Save result
      stepResults.push({
        stepIndex: stepResults.length,
        agentId,
        mode,
        status: 'success',
        result,
        durationMs: Date.now() - stepStartTime,
        timestamp: new Date().toISOString(),
      });
      
      // Save to context if specified
      if (saveAs) {
        context.variables[saveAs] = result;
      }
      
      console.log(`[PipelineExecutor] Step ${i + 1}/${steps.length} completed: ${agentId}`);
    } catch (error: any) {
      stepResults.push({
        stepIndex: stepResults.length,
        agentId,
        mode,
        status: 'error',
        result: null,
        error: error.message,
        durationMs: Date.now() - stepStartTime,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }
}

/**
 * Execute a pipeline
 */
export async function executePipeline(
  pipelineId: string,
  userId: string | null,
  userRole: UserRole,
  sessionId: string | null,
  input: Record<string, any>,
  memoryContext?: Record<string, any>
): Promise<PipelineExecutionResult> {
  const executionId = uuidv4();
  const startTime = Date.now();
  const startedAt = new Date().toISOString();
  
  console.log(`[PipelineExecutor] Starting execution ${executionId} for pipeline ${pipelineId}`);
  
  // Load pipeline
  const pipeline = await loadPipeline(pipelineId);
  if (!pipeline) {
    throw new Error(`Pipeline '${pipelineId}' not found`);
  }
  
  if (!pipeline.enabled) {
    throw new Error(`Pipeline '${pipelineId}' is disabled`);
  }
  
  // Create execution record
  const supabase = getTiqologyDb();
  const { error: insertError } = await supabase
    .from('pipeline_executions')
    .insert({
      id: executionId,
      pipeline_id: pipelineId,
      user_id: userId,
      session_id: sessionId,
      status: 'running',
      steps_completed: 0,
      total_steps: pipeline.steps.length,
      results_by_step: [],
    });
  
  if (insertError) {
    console.error('[PipelineExecutor] Error creating execution record:', insertError);
  }
  
  // Execute steps
  const context: PipelineExecutionContext = {
    pipelineId,
    userId,
    sessionId,
    userRole,
    initialInput: input,
    variables: {},
    memoryContext,
  };
  
  const stepResults: StepResult[] = [];
  let status: 'success' | 'error' | 'timeout' | 'cancelled' = 'success';
  let overallSummary = '';
  
  try {
    await executeSteps(pipeline.steps, context, stepResults);
    
    overallSummary = `Pipeline '${pipeline.name}' completed successfully. ${stepResults.length} steps executed.`;
    status = 'success';
  } catch (error: any) {
    console.error('[PipelineExecutor] Pipeline execution failed:', error);
    overallSummary = `Pipeline '${pipeline.name}' failed: ${error.message}`;
    status = 'error';
  }
  
  const completedAt = new Date().toISOString();
  const durationMs = Date.now() - startTime;
  
  // Update execution record
  const { error: updateError } = await supabase
    .from('pipeline_executions')
    .update({
      status,
      steps_completed: stepResults.length,
      results_by_step: stepResults,
      overall_summary: overallSummary,
      duration_ms: durationMs,
      completed_at: completedAt,
    })
    .eq('id', executionId);
  
  if (updateError) {
    console.error('[PipelineExecutor] Error updating execution record:', updateError);
  }
  
  console.log(`[PipelineExecutor] Execution ${executionId} ${status} (${durationMs}ms)`);
  
  return {
    executionId,
    pipelineId,
    status,
    stepsCompleted: stepResults.length,
    totalSteps: pipeline.steps.length,
    resultsByStep: stepResults,
    overallSummary,
    durationMs,
    startedAt,
    completedAt,
  };
}

/**
 * Get pipeline execution by ID
 */
export async function getPipelineExecution(executionId: string): Promise<PipelineExecutionResult | null> {
  const supabase = getTiqologyDb();
  
  const { data, error } = await supabase
    .from('pipeline_executions')
    .select('*')
    .eq('id', executionId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    executionId: data.id,
    pipelineId: data.pipeline_id,
    status: data.status,
    stepsCompleted: data.steps_completed,
    totalSteps: data.total_steps,
    resultsByStep: data.results_by_step || [],
    overallSummary: data.overall_summary || '',
    durationMs: data.duration_ms || 0,
    startedAt: data.created_at,
    completedAt: data.completed_at || data.created_at,
  };
}
