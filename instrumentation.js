import { registerOTel } from '@vercel/otel';
import { AISDKExporter } from 'langsmith/vercel';

/**
 * Entry point for Vercel OpenTelemetry integration.
 * This file will be loaded on the server at build time.
 */
export function register() {
  console.log('[Instrumentation] Registering OpenTelemetry with Langsmith...');
  registerOTel({
    serviceName: process.env.VERCEL_PROJECT_NAME || 'ai-chatbot',
    traceExporter: new AISDKExporter({ debug: false }),
  });
  console.log('[Instrumentation] OpenTelemetry registration attempted.');
}
