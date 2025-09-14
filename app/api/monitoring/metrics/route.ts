import { NextResponse } from 'next/server';
import { getHist } from '@/lib/metrics/hist';
import { messageTimestamps, errorTimestamps } from '@/lib/metrics/counters';

function exposeProm(): string {
  const inbound = getHist('inbound_ms');
  const dispatch = getHist('dispatch_ms');
  const lines: string[] = [];
  lines.push('# HELP ai_ysh_bus_inbound_ms Inbound processing duration in ms');
  lines.push('# TYPE ai_ysh_bus_inbound_ms summary');
  lines.push(`ai_ysh_bus_inbound_ms{quantile="0.5"} ${inbound.p50}`);
  lines.push(`ai_ysh_bus_inbound_ms{quantile="0.9"} ${inbound.p90}`);
  lines.push(`ai_ysh_bus_inbound_ms{quantile="0.99"} ${inbound.p99}`);
  lines.push(`ai_ysh_bus_inbound_ms_count ${inbound.count}`);
  lines.push(`ai_ysh_bus_inbound_ms_sum ${(inbound.avg * inbound.count) || 0}`);

  lines.push('# HELP ai_ysh_dispatch_ms Dispatcher duration in ms');
  lines.push('# TYPE ai_ysh_dispatch_ms summary');
  lines.push(`ai_ysh_dispatch_ms{quantile="0.5"} ${dispatch.p50}`);
  lines.push(`ai_ysh_dispatch_ms{quantile="0.9"} ${dispatch.p90}`);
  lines.push(`ai_ysh_dispatch_ms{quantile="0.99"} ${dispatch.p99}`);
  lines.push(`ai_ysh_dispatch_ms_count ${dispatch.count}`);
  lines.push(`ai_ysh_dispatch_ms_sum ${(dispatch.avg * dispatch.count) || 0}`);

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

