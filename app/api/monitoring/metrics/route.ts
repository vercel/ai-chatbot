import { NextResponse } from 'next/server';
import { getSamples } from '@/lib/metrics/hist';
import { messageTimestamps, errorTimestamps } from '@/lib/metrics/counters';

function histogram(name: string, samples: number[], buckets: number[]) {
  const lines: string[] = [];
  lines.push(`# HELP ${name} Histogram for ${name}`);
  lines.push(`# TYPE ${name} histogram`);
  let sum = 0;
  for (const v of samples) sum += v;
  const counts = new Array(buckets.length + 1).fill(0); // +Inf bucket
  for (const v of samples) {
    let placed = false;
    for (let i = 0; i < buckets.length; i++) {
      if (v <= buckets[i]) {
        counts[i]++;
        placed = true;
        break;
      }
    }
    if (!placed) counts[buckets.length]++;
  }
  let cumulative = 0;
  for (let i = 0; i < buckets.length; i++) {
    cumulative += counts[i];
    lines.push(`${name}_bucket{le="${buckets[i]}"} ${cumulative}`);
  }
  cumulative += counts[buckets.length];
  lines.push(`${name}_bucket{le="+Inf"} ${cumulative}`);
  lines.push(`${name}_count ${samples.length}`);
  lines.push(`${name}_sum ${sum}`);
  return lines;
}

function exposeProm(): string {
  const inbound = getSamples('inbound_ms');
  const dispatch = getSamples('dispatch_ms');
  const BUCKETS = [10, 25, 50, 100, 250, 500, 1000, 2000, 5000];
  const lines: string[] = [];
  lines.push(...histogram('ai_ysh_bus_inbound_ms', inbound, BUCKETS));
  lines.push(...histogram('ai_ysh_dispatch_ms', dispatch, BUCKETS));
  lines.push('# HELP ai_ysh_bus_messages_total Number of bus messages (approx)');
  lines.push('# TYPE ai_ysh_bus_messages_total counter');
  lines.push(`ai_ysh_bus_messages_total ${messageTimestamps.length}`);
  lines.push('# HELP ai_ysh_bus_errors_total Number of bus errors (approx)');
  lines.push('# TYPE ai_ysh_bus_errors_total counter');
  lines.push(`ai_ysh_bus_errors_total ${errorTimestamps.length}`);
  return lines.join('\n') + '\n';
}

export async function GET() {
  const body = exposeProm();
  return new NextResponse(body, { status: 200, headers: { 'content-type': 'text/plain; version=0.0.4' } });
}
