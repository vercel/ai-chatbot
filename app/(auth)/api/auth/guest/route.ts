import { type NextRequest, NextResponse } from 'next/server';
import { signIn } from '@/app/(auth)/auth';
import { isGuestAccessAllowed } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    // Check cookie first (faster than database call)
    const guestAccessCookie = request.cookies.get('allowGuestAccess');
    const cookieAllowsGuest = guestAccessCookie
      ? guestAccessCookie.value === 'true'
      : true;

    // If cookie says no guest access, redirect to login
    if (!cookieAllowsGuest) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Double-check with database as a fallback
    // This ensures we have the most up-to-date setting
    const guestAccessAllowed = await isGuestAccessAllowed();

    if (!guestAccessAllowed) {
      // If guest access is disabled, redirect to login page
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const redirectUrl = request.nextUrl.searchParams.get('redirectUrl');
    const signInResponse = await signIn('guest', {
      redirect: false,
    });

    const redirectUrlWithParams = redirectUrl
      ? new URL(redirectUrl)
      : new URL('/', request.url);

    return NextResponse.redirect(redirectUrlWithParams);
  } catch (error) {
    console.error('Error signing in as guest:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const dynamic = 'force-dynamic';
