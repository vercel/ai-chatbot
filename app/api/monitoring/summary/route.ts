import { NextResponse } from 'next/server';
import { getMonitoringSnapshot } from '@/lib/metrics/prom';

export const dynamic = 'force-dynamic';

export async function GET() {
  const snap = getMonitoringSnapshot();
  return NextResponse.json(snap);
}

