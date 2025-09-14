import { NextResponse } from 'next/server';
import { renderPromMetrics } from '@/lib/metrics/prom';
import { promEnabled } from '@/lib/monitoring/metrics';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!promEnabled()) {
    return new NextResponse('prometheus disabled', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
  }
  const text = renderPromMetrics();
  return new NextResponse(text, { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

