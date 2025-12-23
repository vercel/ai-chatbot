/**
 * TiQology Services Mesh - Unified API Gateway
 *
 * Central orchestration layer for all internal services:
 * - Voice Engine (TTS/STT)
 * - Video Engine (generation)
 * - Inference Engine (AI models)
 * - Vector DB (embeddings)
 *
 * Features:
 * - Unified API
 * - Smart routing
 * - Performance monitoring
 * - Cost tracking
 * - Error handling
 * - Automatic fallback
 */

import { vectorDB } from "@/lib/vector/pgvector";

interface ServiceRequest {
  service: "voice" | "video" | "inference" | "vector";
  action: string;
  params: Record<string, any>;
  userId: string;
  tier: "free" | "starter" | "pro" | "enterprise";
}

interface ServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  metrics: {
    latency_ms: number;
    cost_usd: number;
    service: string;
    model?: string;
  };
}

interface ServiceMetric {
  service: string;
  action: string;
  latency_ms: number;
  cost_usd: number;
  user_id: string;
  success: boolean;
  error?: string;
  timestamp: Date;
}

class TiQologyServicesMesh {
  private voiceEngineUrl: string;
  private videoEngineUrl: string;
  private inferenceEngineUrl: string;

  constructor() {
    // Service endpoints (can be configured via environment variables)
    this.voiceEngineUrl =
      process.env.VOICE_ENGINE_URL || "http://voice-engine:8001";
    this.videoEngineUrl =
      process.env.VIDEO_ENGINE_URL || "http://video-engine:8002";
    this.inferenceEngineUrl =
      process.env.INFERENCE_ENGINE_URL || "http://inference-engine:8000";
  }

  /**
   * Execute service request
   */
  async execute(request: ServiceRequest): Promise<ServiceResponse> {
    const startTime = Date.now();

    try {
      let result: any;
      let cost = 0;
      let model: string | undefined;

      // Route to appropriate service
      switch (request.service) {
        case "voice":
          result = await this.handleVoice(request);
          cost = 0; // Internal, free
          break;

        case "video":
          result = await this.handleVideo(request);
          cost = 0; // Internal, free
          break;

        case "inference": {
          const inferenceResult = await this.handleInference(request);
          result = inferenceResult.result;
          cost = inferenceResult.cost;
          model = inferenceResult.model;
          break;
        }

        case "vector":
          result = await this.handleVector(request);
          cost = 0; // Internal, free
          break;

        default:
          throw new Error(`Unknown service: ${request.service}`);
      }

      const latency = Date.now() - startTime;

      // Log metrics
      await this.logMetrics({
        service: request.service,
        action: request.action,
        latency_ms: latency,
        cost_usd: cost,
        user_id: request.userId,
        success: true,
        timestamp: new Date(),
      });

      return {
        success: true,
        data: result,
        metrics: {
          latency_ms: latency,
          cost_usd: cost,
          service: request.service,
          model,
        },
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;

      // Log error
      await this.logMetrics({
        service: request.service,
        action: request.action,
        latency_ms: latency,
        cost_usd: 0,
        user_id: request.userId,
        success: false,
        error: error.message,
        timestamp: new Date(),
      });

      return {
        success: false,
        error: error.message,
        metrics: {
          latency_ms: latency,
          cost_usd: 0,
          service: request.service,
        },
      };
    }
  }

  /**
   * Handle voice service requests
   */
  private async handleVoice(request: ServiceRequest): Promise<any> {
    const { action, params } = request;

    switch (action) {
      case "tts":
        return await this.callVoiceService("/tts", params);

      case "stt":
        return await this.callVoiceService("/stt", params);

      case "clone":
        return await this.callVoiceService("/clone", params);

      default:
        throw new Error(`Unknown voice action: ${action}`);
    }
  }

  /**
   * Handle video service requests
   */
  private async handleVideo(request: ServiceRequest): Promise<any> {
    const { action, params } = request;

    switch (action) {
      case "generate":
        return await this.callVideoService("/generate", params);

      case "upscale":
        return await this.callVideoService("/upscale", params);

      case "interpolate":
        return await this.callVideoService("/interpolate", params);

      default:
        throw new Error(`Unknown video action: ${action}`);
    }
  }

  /**
   * Handle inference service requests
   */
  private async handleInference(request: ServiceRequest): Promise<{
    result: any;
    cost: number;
    model: string;
  }> {
    const { params, tier } = request;

    // Smart routing based on complexity and user tier
    const modelName = await this.selectModel(params.prompt, tier);

    // Check if internal or external model
    if (this.isInternalModel(modelName)) {
      // Use internal inference engine
      const result = await this.callInferenceService(modelName, params);
      const cost = this.calculateInferenceCost(result, modelName);

      return { result, cost, model: modelName };
    }
    // Use external API
    const result = await this.callExternalAPI(modelName, params);
    const cost = this.calculateInferenceCost(result, modelName);

    return { result, cost, model: modelName };
  }

  /**
   * Handle vector DB requests
   */
  private async handleVector(request: ServiceRequest): Promise<any> {
    const { action, params, userId } = request;

    switch (action) {
      case "search":
        return await vectorDB.search(params.embedding, {
          userId: params.user_id || userId,
          limit: params.limit || 10,
          minSimilarity: params.min_similarity || 0.7,
        });

      case "insert":
        return await vectorDB.insert(
          userId,
          params.content,
          params.embedding,
          params.metadata || {}
        );

      case "batch_insert":
        return await vectorDB.batchInsert(userId, params.records);

      case "delete":
        await vectorDB.delete(params.id);
        return { success: true };

      case "count":
        return await vectorDB.count(userId);

      default:
        throw new Error(`Unknown vector action: ${action}`);
    }
  }

  /**
   * Select best model based on prompt and user tier
   */
  private async selectModel(prompt: string, tier: string): Promise<string> {
    // Simple complexity analysis
    const complexity = this.analyzeComplexity(prompt);

    // Free tier: Always use Llama 8B
    if (tier === "free") {
      return "llama-3.1-8b";
    }

    // Starter tier: Llama 8B for simple, 70B for complex
    if (tier === "starter") {
      return complexity === "simple" ? "llama-3.1-8b" : "llama-3.1-70b";
    }

    // Pro tier: Best internal for most, external for complex
    if (tier === "pro") {
      if (complexity === "complex") {
        return "gpt-4"; // External for best quality
      }
      return "llama-3.1-70b";
    }

    // Enterprise: Always best quality
    if (tier === "enterprise") {
      return complexity === "complex" ? "gpt-4" : "llama-3.1-70b";
    }

    return "llama-3.1-8b"; // Default
  }

  /**
   * Analyze prompt complexity
   */
  private analyzeComplexity(prompt: string): "simple" | "medium" | "complex" {
    // Code generation = complex
    if (/write|create|build|implement|code|function|class/i.test(prompt)) {
      return "complex";
    }

    // Math/reasoning = complex
    if (/calculate|solve|prove|analyze|compare|evaluate/i.test(prompt)) {
      return "complex";
    }

    // Long context = medium
    if (prompt.length > 2000) {
      return "medium";
    }

    // Simple Q&A
    return "simple";
  }

  /**
   * Check if model is internal
   */
  private isInternalModel(modelName: string): boolean {
    return (
      modelName.startsWith("llama") ||
      modelName.startsWith("mixtral") ||
      modelName.startsWith("mistral")
    );
  }

  /**
   * Call voice service
   */
  private async callVoiceService(endpoint: string, params: any): Promise<any> {
    const response = await fetch(`${this.voiceEngineUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Voice service error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Call video service
   */
  private async callVideoService(endpoint: string, params: any): Promise<any> {
    const response = await fetch(`${this.videoEngineUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Video service error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Call inference service
   */
  private async callInferenceService(model: string, params: any): Promise<any> {
    const response = await fetch(`${this.inferenceEngineUrl}/v1/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: params.prompt,
        max_tokens: params.max_tokens || 2048,
        temperature: params.temperature || 0.7,
        top_p: params.top_p || 0.9,
      }),
    });

    if (!response.ok) {
      throw new Error(`Inference service error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Call external API
   */
  private async callExternalAPI(model: string, params: any): Promise<any> {
    if (model.startsWith("gpt")) {
      return await this.callOpenAI(model, params);
    }

    if (model.startsWith("claude")) {
      return await this.callAnthropic(model, params);
    }

    throw new Error(`Unknown external model: ${model}`);
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(model: string, params: any): Promise<any> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: params.prompt }],
        max_tokens: params.max_tokens || 2048,
        temperature: params.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropic(model: string, params: any): Promise<any> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: params.prompt }],
        max_tokens: params.max_tokens || 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Calculate inference cost
   */
  private calculateInferenceCost(result: any, model: string): number {
    const inputTokens = result.usage?.prompt_tokens || 0;
    const outputTokens = result.usage?.completion_tokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // Costs per 1M tokens
    const costs: Record<string, number> = {
      "llama-3.1-8b": 0,
      "llama-3.1-70b": 2,
      "mixtral-8x7b": 1,
      "gpt-4": 30,
      "gpt-3.5-turbo": 1,
      "claude-3-opus": 30,
      "claude-3-sonnet": 15,
    };

    const costPerMillion = costs[model] || 0;
    return (totalTokens / 1_000_000) * costPerMillion;
  }

  /**
   * Log metrics to database
   */
  private async logMetrics(metrics: ServiceMetric): Promise<void> {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      );

      await supabase.from("service_metrics").insert({
        service: metrics.service,
        action: metrics.action,
        latency_ms: metrics.latency_ms,
        cost_usd: metrics.cost_usd,
        user_id: metrics.user_id,
        success: metrics.success,
        error: metrics.error,
        timestamp: metrics.timestamp,
      });
    } catch (error) {
      // Don't fail request if metrics logging fails
      console.error("Failed to log metrics:", error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<Record<string, boolean>> {
    return {
      voice: await this.checkServiceHealth(this.voiceEngineUrl),
      video: await this.checkServiceHealth(this.videoEngineUrl),
      inference: await this.checkServiceHealth(this.inferenceEngineUrl),
      vector: await vectorDB.healthCheck(),
    };
  }

  /**
   * Check service health
   */
  private async checkServiceHealth(url: string): Promise<boolean> {
    try {
      const response = await fetch(`${url}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const servicesMesh = new TiQologyServicesMesh();

// Export class for testing
export { TiQologyServicesMesh };
