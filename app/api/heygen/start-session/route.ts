import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { sessionId, sdp } = await request.json();
    const apiKey = process.env.HEYGEN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'HeyGen API key not configured' },
        { status: 500 }
      );
    }

    // Start the session with HeyGen
    const response = await fetch(
      'https://api.heygen.com/v1/streaming.start',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({
          session_id: sessionId,
          sdp: {
            type: 'answer',
            sdp: sdp,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('HeyGen start session error:', error);
      return NextResponse.json(
        { error: 'Failed to start HeyGen session' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error starting HeyGen session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

