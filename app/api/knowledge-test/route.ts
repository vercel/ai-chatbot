import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Simple test endpoint to see if API routes are working
export async function GET(req: NextRequest) {
  console.log('[API] GET /api/knowledge-test received');
  return NextResponse.json({ message: 'Knowledge test API is working' });
}

export async function POST(req: NextRequest) {
  console.log('[API] POST /api/knowledge-test received');
  console.log('[API] Request URL:', req.url);
  
  try {
    const formData = await req.formData();
    const keys = Array.from(formData.keys());
    
    console.log('[API] Received form data keys:', keys);
    
    return NextResponse.json({
      message: 'Test endpoint received data',
      keys
    }, { status: 200 });
  } catch (error) {
    console.error('[API] Error in test endpoint:', error);
    return NextResponse.json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}