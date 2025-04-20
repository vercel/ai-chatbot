import { registerOTel } from '@vercel/otel';
import { AISDKExporter } from 'langsmith/vercel';

/**
 * Entry point for Vercel OpenTelemetry integration.
 * This file will be loaded on the server at build time.
 */
export function register() {
  registerOTel({
    serviceName: process.env.VERCEL_PROJECT_NAME || 'ai-chatbot',
    traceExporter: new AISDKExporter(),
  });
}
