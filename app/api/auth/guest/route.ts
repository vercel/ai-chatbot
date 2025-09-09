import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirectUrl') || '/';

  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.session?.token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const signInResponse = await auth.api.signInAnonymous({
    query: {
      callbackURL: redirectUrl,
    },
    asResponse: true,
    headers: request.headers,
  });

  const response = NextResponse.redirect(new URL(redirectUrl, request.url));

  const setCookie = signInResponse.headers.get('set-cookie');
  if (setCookie) {
    response.headers.set('set-cookie', setCookie);
  }

  return response;
}
