/**
 * TiQology Core DB Client
 * 
 * Supabase client for logging AgentOS evaluations to the TiQology Core database.
 * Used by Ghost and Best Interest evaluation agents to persist results.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton Supabase client
let supabaseClient: SupabaseClient | null = null;

/**
 * Get or create Supabase client
 */
function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.TIQ_SUPABASE_URL;
  const supabaseKey = process.env.TIQ_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Missing Supabase credentials. Set TIQ_SUPABASE_URL and TIQ_SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseClient;
}

/**
 * Dimension score for evaluation
 */
export interface DimensionScore {
  dimensionName: string;
  score: number;
  reasoning?: string;
}

/**
 * Evaluation log input
 */
export interface EvaluationLogInput {
  orgId: string;
  caseId?: string;
  evaluatorUserId?: string;
  evaluationType: 'ghost' | 'best_interest';
  modelFlavor: 'fast' | 'deep';
  overallScore: number;
  summary?: string;
  dimensions?: DimensionScore[];
  rawRequest?: Record<string, any>;
  rawResponse?: Record<string, any>;
}

/**
 * Log evaluation result
 * 
 * Result includes evaluation ID and any logging errors
 */
export interface LogEvaluationResult {
  evaluationId?: string;
  loggingError?: string;
}

/**
 * Log an evaluation to TiQology Core DB
 * 
 * Inserts into:
 * - public.evaluations
 * - public.evaluation_dimension_scores (if dimensions provided)
 * 
 * @param input - Evaluation data
 * @returns Result with evaluation ID or error
 */
export async function logEvaluation(
  input: EvaluationLogInput
): Promise<LogEvaluationResult> {
  try {
    const supabase = getSupabaseClient();

    // Insert evaluation record
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .insert({
        org_id: input.orgId,
        case_id: input.caseId || null,
        evaluator_user_id: input.evaluatorUserId || null,
        evaluation_type: input.evaluationType,
        model_flavor: input.modelFlavor,
        overall_score: input.overallScore,
        summary: input.summary || null,
        raw_request: input.rawRequest || null,
        raw_response: input.rawResponse || null,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (evalError) {
      console.error('Failed to insert evaluation:', evalError);
      return {
        loggingError: `Evaluation insert failed: ${evalError.message}`,
      };
    }

    const evaluationId = evaluation.id;

    // Insert dimension scores if provided
    if (input.dimensions && input.dimensions.length > 0) {
      const dimensionRows = input.dimensions.map((dim) => ({
        evaluation_id: evaluationId,
        dimension_name: dim.dimensionName,
        score: dim.score,
        reasoning: dim.reasoning || null,
      }));

      const { error: dimError } = await supabase
        .from('evaluation_dimension_scores')
        .insert(dimensionRows);

      if (dimError) {
        console.error('Failed to insert dimension scores:', dimError);
        return {
          evaluationId,
          loggingError: `Dimension scores insert failed: ${dimError.message}`,
        };
      }
    }

    return { evaluationId };
  } catch (error) {
    console.error('logEvaluation error:', error);
    return {
      loggingError: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * AgentOS event log entry
 */
export interface AgentOSEventInput {
  eventType: 'evaluation_run' | 'agent_task' | 'pipeline_execution';
  agentId: string;
  taskId: string;
  orgId?: string;
  caseId?: string;
  userId?: string;
  status: 'started' | 'completed' | 'failed';
  metadata?: Record<string, any>;
  errorDetails?: Record<string, any>;
}

/**
 * Log AgentOS event to agentos_event_log
 * 
 * @param input - Event data
 * @returns Event ID or error
 */
export async function logAgentOSEvent(
  input: AgentOSEventInput
): Promise<LogEvaluationResult> {
  try {
    const supabase = getSupabaseClient();

    const { data: event, error: eventError } = await supabase
      .from('agentos_event_log')
      .insert({
        event_type: input.eventType,
        agent_id: input.agentId,
        task_id: input.taskId,
        org_id: input.orgId || null,
        case_id: input.caseId || null,
        user_id: input.userId || null,
        status: input.status,
        metadata: input.metadata || null,
        error_details: input.errorDetails || null,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (eventError) {
      console.error('Failed to insert AgentOS event:', eventError);
      return {
        loggingError: `Event log insert failed: ${eventError.message}`,
      };
    }

    return { evaluationId: event.id };
  } catch (error) {
    console.error('logAgentOSEvent error:', error);
    return {
      loggingError: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper to extract metadata from AgentOS task for logging
 */
export function extractEvaluationMetadata(task: any): {
  orgId?: string;
  caseId?: string;
  userId?: string;
} {
  return {
    orgId: task.metadata?.orgId || task.metadata?.organizationId,
    caseId: task.metadata?.caseId,
    userId: task.metadata?.userId || task.metadata?.requestedBy,
  };
}
