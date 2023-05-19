import { userSessionCookieName } from '@/lib/session/constants';
import { serialize } from 'cookie';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { origin, searchParams } = req.nextUrl;
  const next = searchParams.get('next');

  return NextResponse.redirect(new URL(next ?? '/', origin), {
    headers: [
      [
        'set-cookie',
        serialize(userSessionCookieName, '', {
          path: '/',
          maxAge: 0,
          expires: new Date(),
          httpOnly: true,
          secure: process.env.NODE_ENV !== 'development',
        }),
      ],
    ],
  });
}
