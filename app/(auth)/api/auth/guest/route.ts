import { signIn } from '@/app/auth';
import { isDevelopmentEnvironment } from '@/lib/constants';
import { auth } from '@/app/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get('redirectUrl') || '/';

  const session = await auth();

  if (session) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return signIn('guest', { redirect: true, redirectTo: redirectUrl });
}
