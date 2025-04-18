import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the Auth Helpers package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-sign-in-with-code-exchange
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const supabase = await createClient(); // Create client once

  if (code) {
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && sessionData?.session && sessionData?.user) {
      // --- START: Added Logic for Token Saving and Webhook ---
      const session = sessionData.session;
      const user = sessionData.user;
      const providerToken = session.provider_token ?? null;
      const refreshToken = session.provider_refresh_token ?? null;
      const userId = user.id;
      const userEmail = user.email; // Assuming email is available

      console.log(
        `Auth Callback [Correct File]: Processing successful exchange for user ${userId} (${userEmail})`,
      );

      // 1. Save Provider Tokens (if they exist)
      if (providerToken || refreshToken) {
        try {
          const { error: dbError } = await supabase
            .from('user_provider_tokens') // Use the public table name
            .upsert(
              {
                user_id: userId,
                provider: 'google', // Assuming google for now
                email: userEmail,
                access_token: providerToken,
                refresh_token: refreshToken,
              },
              { onConflict: 'user_id, provider' }, // Adjust if your constraint differs
            );

          if (dbError) {
            console.error(
              `Auth Callback [Correct File] Error - Saving Tokens for user ${userId}:`,
              dbError,
            );
            // Log error but continue
          } else {
            console.log(
              `Auth Callback [Correct File]: Successfully saved provider tokens for user ${userId}.`,
            );
          }
        } catch (dbCatchError) {
          console.error(
            `Auth Callback [Correct File] EXCEPTION - Saving Tokens for user ${userId}:`,
            dbCatchError,
          );
          // Log error but continue
        }
      } else {
        console.log(
          `Auth Callback [Correct File]: No provider_token or provider_refresh_token found in session for user ${userId}. Skipping token save.`,
        );
      }

      // 2. Call Webhook
      try {
        const webhookUrl =
          'https://n8n-naps.onrender.com/webhook/64fc6422-135f-4e81-bd23-8fc61daee99e';
        const payload = {
          user_id: userId,
          email: userEmail,
          phone: user.phone ?? null,
          created_at: user.created_at,
          updated_at: user.updated_at,
          raw_user_meta_data: user.user_metadata ?? {},
          raw_app_meta_data: user.app_metadata ?? {},
          provider_tokens: {
            access_token: providerToken,
            refresh_token: refreshToken,
          },
        };

        console.log(
          `Auth Callback [Correct File]: Calling webhook for user ${userId}...`,
        );
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(
            `Auth Callback [Correct File] Error - Webhook failed for user ${userId}: ${response.status} ${response.statusText}`,
            errorBody,
          );
          // Log webhook failure but continue
        } else {
          console.log(
            `Auth Callback [Correct File]: Successfully sent webhook for user ${userId}. Status: ${response.status}`,
          );
        }
      } catch (webhookCatchError) {
        console.error(
          `Auth Callback [Correct File] EXCEPTION - Calling webhook for user ${userId}:`,
          webhookCatchError,
        );
        // Log webhook exception but continue
      }
      // --- END: Added Logic for Token Saving and Webhook ---

      // URL to redirect to after sign in process completes
      console.log(
        `Auth Callback [Correct File]: Redirecting user ${userId} to ${origin}/`,
      );
      return NextResponse.redirect(`${origin}/`); // Redirect to home page on success
    } else if (exchangeError) {
      // Handle case where exchange failed
      console.error(
        'Auth Callback [Correct File] Error - Code Exchange:',
        exchangeError?.message ?? 'Unknown exchange error',
        requestUrl.searchParams.get('error'),
      );
    } else {
      // Handle case where exchange succeeded but session/user data is missing
      console.error(
        'Auth Callback [Correct File] Error: Session or User data missing after successful code exchange.',
      );
    }
  } else {
    console.error(
      'Auth Callback [Correct File] Error: No code parameter found in URL.',
    );
  }

  // URL to redirect to in case of any error or missing code
  // Log the specific Supabase error if available from the URL params
  const supabaseError = requestUrl.searchParams.get('error_description');
  console.error(
    'Auth Callback [Correct File]: Redirecting to login due to error.',
    supabaseError ?? 'Could not authenticate user (no specific error in URL)',
  );
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(supabaseError ?? 'Could not authenticate user')}`,
  ); // Redirect back to login on error
}
