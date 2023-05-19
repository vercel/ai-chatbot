import { NextRequest, NextResponse } from 'next/server';
import { serialize } from 'cookie';
import { createSession } from '@/lib/session/create';
import { encryptJWECookie } from '@/lib/cookies/encrypt-jwe';
import ms from 'ms';
import { userSessionCookieName } from '@/lib/session/constants';

export const runtime = 'edge';

const sharedTokenSecret = process.env.SHARE_TOKEN_ENDPOINT_SECRET;
const cookieTTL = ms('1y');

export async function GET(req: NextRequest) {
  const { origin, searchParams } = req.nextUrl;
  const shareableToken = searchParams.get('shareableToken');

  if (!sharedTokenSecret || !shareableToken) {
    // TODO: Make an error page
    return NextResponse.json({ error: 'Invalid request' }, { status: 500 });
  }

  const query = new URLSearchParams({
    sharedTokenSecret,
  });

  const response = await fetch(
    `https://api.vercel.com/user/tokens/shared/${shareableToken}?${query.toString()}`
  );

  const { token } = (await response.json()) as { token: string };

  const session = await createSession(token);

  const cookieValue = await encryptJWECookie(session, '1y');
  const next = req.cookies.get('auth-next')?.value;

  return NextResponse.redirect(new URL(next ?? '/', origin), {
    headers: [
      [
        'set-cookie',
        serialize(userSessionCookieName, cookieValue, {
          path: '/',
          maxAge: cookieTTL / 1000,
          expires: new Date(Date.now() + cookieTTL),
          httpOnly: true,
          secure: process.env.NODE_ENV !== 'development',
        }),
      ],
      // There's currently an issue with adding more than one cookie to a response: https://github.com/vercel/next.js/issues/46579
      // the `auth-next` cookie will expire in 10 min anyway
      // [
      //   'set-cookie',
      //   serialize('auth-next', '', {
      //     path: '/api/auth/callback',
      //     maxAge: 0,
      //     expires: new Date(),
      //     httpOnly: true,
      //   })
      // ]
    ],
  });
}
