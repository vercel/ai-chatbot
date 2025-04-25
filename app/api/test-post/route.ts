import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('[API /api/test-post] POST function invoked.');
  const body = await req.text(); // Read body to ensure request is processed
  return NextResponse.json({
    success: true,
    message: 'Test POST received',
    bodyLength: body.length,
  });
}

export async function GET(req: Request) {
  console.log('[API /api/test-post] GET function invoked.');
  return NextResponse.json({ success: true, message: 'Test GET received' });
}
