import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'HeyGen API key not configured' },
        { status: 500 }
      );
    }

    // Test the API key by listing available avatars
    const response = await fetch(
      'https://api.heygen.com/v2/avatars',
      {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('HeyGen API error:', error);
      return NextResponse.json(
        {
          error: 'HeyGen API key invalid or API error',
          details: error
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      message: 'HeyGen API key is valid',
      avatarsCount: data.avatars?.length || 0,
      avatars: data.avatars?.slice(0, 5).map((a: any) => ({
        id: a.avatar_id,
        name: a.avatar_name,
      })) || []
    });
  } catch (error) {
    console.error('Error testing HeyGen:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
