import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the Auth Helpers package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-sign-in-with-code-exchange
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // URL to redirect to after sign in process completes
      return NextResponse.redirect(`${origin}/`); // Redirect to home page on success
    }
  }

  // URL to redirect to in case of error
  console.error(
    'Supabase auth callback error',
    requestUrl.searchParams.get('error'),
  );
  return NextResponse.redirect(
    `${origin}/login?error=Could not authenticate user`,
  ); // Redirect back to login on error
}
