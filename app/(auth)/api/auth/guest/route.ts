import { signIn } from '@/app/(auth)/auth';
import { isDevelopmentEnvironment } from '@/lib/constants';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let redirectUrl = searchParams.get('redirectUrl') || '/';
  
  // Fix localhost redirects to use the current host
  if (redirectUrl.includes('localhost:3000')) {
    const currentUrl = new URL(request.url);
    redirectUrl = redirectUrl.replace('http://localhost:3000', `${currentUrl.protocol}//${currentUrl.host}`);
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return signIn('guest', { redirect: true, redirectTo: redirectUrl });
}
