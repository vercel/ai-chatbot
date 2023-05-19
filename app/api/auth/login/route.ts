import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { origin } = req.nextUrl;

  const next = req.nextUrl.searchParams.get('next');

  const params = new URLSearchParams({
    redirectUrl: new URL('/api/auth/callback', origin).toString(),
  });

  return NextResponse.redirect(
    `https://vercel.com/api/vercel-auth?${params.toString()}`,
    {
      headers: next
        ? {
            'Set-Cookie': serialize('auth-next', next, {
              path: '/api/auth/callback',
              maxAge: 60 * 60 * 10,
              httpOnly: true,
            }),
          }
        : undefined,
    }
  );
}
