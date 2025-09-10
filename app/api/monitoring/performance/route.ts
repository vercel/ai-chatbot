import { NextResponse } from 'next/server';
import { msgsPerHour, errorsPerHour, lastFiveMinutes } from '@/lib/metrics/collectors';

export async function GET() {
  return NextResponse.json({
    msgs_per_hour: msgsPerHour(),
    errors_per_hour: errorsPerHour(),
    last_5m: lastFiveMinutes(),
  });
}
