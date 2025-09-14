import { NextResponse } from 'next/server';
import { getAllHists } from '@/lib/metrics/hist';
import { messageTimestamps, errorTimestamps } from '@/lib/metrics/counters';

export async function GET() {
  const h = getAllHists();
  return NextResponse.json({
    ts: Date.now(),
    counters: {
      bus_inbound_total: messageTimestamps.length,
      worker_errors_total: errorTimestamps.length,
    },
    histograms: h,
  });
}

