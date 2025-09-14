import { registerOTel } from '@vercel/otel';

export function register() {
  registerOTel({ serviceName: 'ai-chatbot' });
  try {
    // Start simple alert monitor for ai_latency_ms p95
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    require('./lib/monitoring/alerts').startLatencyMonitor();
  } catch {}
}
