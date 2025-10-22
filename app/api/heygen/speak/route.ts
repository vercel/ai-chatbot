import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { sessionId, text } = await request.json();
    const apiKey = process.env.HEYGEN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'HeyGen API key not configured' },
        { status: 500 }
      );
    }

    // Send text to speak to HeyGen
    const response = await fetch(
      'https://api.heygen.com/v1/streaming.task',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({
          session_id: sessionId,
          text: text,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('HeyGen speak error:', error);
      return NextResponse.json(
        { error: 'Failed to send speech to HeyGen' },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending speech to HeyGen:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

