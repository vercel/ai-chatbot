import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'HeyGen API key not configured' },
        { status: 500 }
      );
    }

    // Create a new session with HeyGen
    const response = await fetch(
      'https://api.heygen.com/v1/streaming.new',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
        },
        body: JSON.stringify({
          quality: 'high',
          avatar_name: process.env.HEYGEN_AVATAR_ID || 'Wayne_20240711',
          voice: {
            voice_id: process.env.HEYGEN_VOICE_ID || '1bd001e7e50f421d891986aad5158bc8',
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('HeyGen API error:', error);
      return NextResponse.json(
        { error: 'Failed to create HeyGen session' },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      sessionId: data.session_id,
      sdp: data.sdp.sdp,
      iceServers: data.ice_servers2 || [],
    });
  } catch (error) {
    console.error('Error creating HeyGen session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

