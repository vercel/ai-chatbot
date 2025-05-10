import { NextResponse } from 'next/server';
import { getAbsoluteUrl } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test internal fetch with absolute URL
    const response = await fetch(getAbsoluteUrl('/api/health-check'), {
      cache: 'no-store',
    });

    const data = await response.json();

    return NextResponse.json({
      status: 'success',
      baseUrl: getAbsoluteUrl(''),
      fetchedUrl: getAbsoluteUrl('/api/health-check'),
      healthCheckResult: data,
    });
  } catch (error: any) {
    console.error('Test fetch error:', error);
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
