import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { sessionId } = await request.json();
    const apiKey = process.env.HEYGEN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'HeyGen API key not configured' },
        { status: 500 }
      );
    }

    // Stop the session with HeyGen
    const response = await fetch(
      'https://api.heygen.com/v1/streaming.stop',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('HeyGen stop session error:', error);
      return NextResponse.json(
        { error: 'Failed to stop HeyGen session' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error stopping HeyGen session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

