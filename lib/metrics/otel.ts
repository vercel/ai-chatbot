import { metrics } from '@opentelemetry/api';

const histograms = new Map<string, ReturnType<ReturnType<typeof metrics.getMeter>['createHistogram']>>();

export function otelRecordHistogram(name: string, value: number) {
  if (process.env.OTEL_METRICS !== 'on') return;
  const meter = metrics.getMeter('ai-ysh');
  let h = histograms.get(name);
  if (!h) {
    h = meter.createHistogram(name, { description: `${name} duration` });
    histograms.set(name, h);
  }
  h.record(value);
}

