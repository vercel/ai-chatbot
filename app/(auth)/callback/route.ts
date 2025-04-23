// app/auth/callback/route.ts

import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  // ---------- SUPABASE (SERVICE-ROLE) ----------
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // MUST be the service-role key
  );
  // ---------------------------------------------

  // ---------- CLIENT IP (optional) -------------
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded
    ? forwarded.split(/, /)[0]
    : request.headers.get('x-real-ip');
  // ---------------------------------------------

  if (code) {
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && sessionData?.session && sessionData?.user) {
      const session = sessionData.session;
      const user = sessionData.user;
      const providerToken = session.provider_token ?? null;
      const refreshToken = session.provider_refresh_token ?? null;
      const userId = user.id;
      const userEmail = user.email;

      // ----- SAVE REFRESH TOKEN -----------------
      if (refreshToken) {
        await supabase
          .from('User_Profiles')
          .update({ google_refresh_token: refreshToken })
          .eq('id', userId);
      }
      // ------------------------------------------

      // ----- CHECK NEW USER ---------------------
      let isNewUser = false;
      {
        const { data } = await supabase
          .from('User_Profiles')
          .select('id', { count: 'exact', head: true })
          .eq('id', userId)
          .limit(1);
        isNewUser = !data;
      }
      // ------------------------------------------

      // ----- OPTIONAL WEBHOOK -------------------
      if (isNewUser) {
        await fetch(
          process.env.SIGNUP_WEBHOOK_URL ??
            'https://n8n-naps.onrender.com/webhook/64fc6422-135f-4e81-bd23-8fc61daee99e',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              email: userEmail,
              phone: user.phone ?? null,
              created_at: user.created_at,
              updated_at: user.updated_at,
              ip_address: ipAddress,
              raw_user_meta_data: user.user_metadata ?? {},
              raw_app_meta_data: user.app_metadata ?? {},
              provider_tokens: {
                access_token: providerToken,
                refresh_token: refreshToken ?? undefined,
              },
            }),
          },
        );
      }
      // ------------------------------------------

      return NextResponse.redirect(`${origin}/`);
    }
  }

  const supabaseError = requestUrl.searchParams.get('error_description');
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(
      supabaseError ?? 'Could not authenticate user',
    )}`,
  );
}
