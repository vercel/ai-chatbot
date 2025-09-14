import { NextResponse } from 'next/server';
import { renderPromMetrics } from '@/lib/metrics/prom';

export const dynamic = 'force-dynamic';

export async function GET() {
  const text = renderPromMetrics();
  return new NextResponse(text, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

