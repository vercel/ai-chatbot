import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();

    // Exchange code for session
    console.log('Auth Callback: Attempting code exchange...'); // Log before exchange
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    // --- VERY IMPORTANT: Log token presence immediately after exchange ---
    console.log('Auth Callback: Code exchange completed.');
    console.log(`Auth Callback: Has sessionData? ${!!sessionData}`);
    console.log(
      `Auth Callback: Has sessionData.session? ${!!sessionData?.session}`,
    );
    console.log(
      `Auth Callback: provider_token present? ${!!sessionData?.session?.provider_token}`,
    );
    console.log(
      `Auth Callback: provider_refresh_token present? ${!!sessionData?.session?.provider_refresh_token}`,
    );
    console.log(
      `Auth Callback: Error during exchange? ${exchangeError?.message ?? 'No'}`,
    );
    // --- End of critical token logging ---

    if (exchangeError) {
      console.error(
        'Auth Callback Error - Code Exchange:',
        exchangeError.message,
      );
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/auth-code-error?error=${encodeURIComponent(
          exchangeError.message,
        )}`,
      );
    }

    // --- Logic based on Documentation ---
    if (sessionData?.session && sessionData?.user) {
      const session = sessionData.session;
      const user = sessionData.user;
      const providerToken = session.provider_token ?? null;
      const refreshToken = session.provider_refresh_token ?? null;
      const userId = user.id;
      const userEmail = user.email;

      console.log(
        `Auth Callback: Processing successful exchange for user ${userId} (${userEmail})`,
      );

      // 1. Save Provider Tokens (if they exist)
      if (providerToken || refreshToken) {
        try {
          const { error: dbError } = await supabase
            .from('user_provider_tokens') // Use the public table
            .upsert(
              {
                user_id: userId,
                provider: 'google',
                email: userEmail, // Save email here too
                access_token: providerToken,
                refresh_token: refreshToken,
                // created_at and updated_at will use default values
              },
              { onConflict: 'user_id, provider' }, // Ensure this matches your unique constraint
            );

          if (dbError) {
            // Log error but don't block the login flow
            console.error(
              `Auth Callback Error - Saving Tokens for user ${userId}:`,
              dbError,
            );
          } else {
            console.log(
              `Auth Callback: Successfully saved provider tokens for user ${userId}.`,
            );
          }
        } catch (dbCatchError) {
          console.error(
            `Auth Callback EXCEPTION - Saving Tokens for user ${userId}:`,
            dbCatchError,
          );
        }
      } else {
        console.log(
          `Auth Callback: No provider_token or provider_refresh_token found in session for user ${userId}. Skipping token save.`,
        );
      }

      // 2. Call Webhook
      try {
        const webhookUrl =
          'https://n8n-naps.onrender.com/webhook/64fc6422-135f-4e81-bd23-8fc61daee99e';
        // Construct payload similar to the trigger attempt, ensure data freshness
        const payload = {
          user_id: userId,
          email: userEmail,
          phone: user.phone ?? null, // Get from user object
          created_at: user.created_at, // Get from user object
          updated_at: user.updated_at, // Get from user object
          raw_user_meta_data: user.user_metadata ?? {},
          raw_app_meta_data: user.app_metadata ?? {},
          provider_tokens: {
            // Send the actual tokens obtained here
            access_token: providerToken,
            refresh_token: refreshToken,
          },
        };

        console.log(`Auth Callback: Calling webhook for user ${userId}...`);
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          // Log webhook failure but don't block login
          const errorBody = await response.text();
          console.error(
            `Auth Callback Error - Webhook failed for user ${userId}: ${response.status} ${response.statusText}`,
            errorBody,
          );
        } else {
          console.log(
            `Auth Callback: Successfully sent webhook for user ${userId}. Status: ${response.status}`,
          );
        }
      } catch (webhookCatchError) {
        console.error(
          `Auth Callback EXCEPTION - Calling webhook for user ${userId}:`,
          webhookCatchError,
        );
      }
    } else {
      // Handle cases where session/user might be unexpectedly null after exchange
      console.error(
        'Auth Callback Error: Session or User data unexpectedly missing after successful code exchange.',
      );
      // Redirect to error page or login
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/auth-code-error?error=Session%20or%20User%20data%20missing`,
      );
    }
    // --- End of Logic based on Documentation ---

    // Redirect user after processing
    console.log(
      `Auth Callback: Redirecting user ${sessionData?.user?.id} to ${next}`,
    );
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    if (isLocalEnv) {
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    } else {
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }
  } // End if(code)

  // Fallback redirect if no code
  console.error('Auth Callback Error: No code parameter found in URL.');
  return NextResponse.redirect(
    `${requestUrl.origin}/auth/auth-code-error?error=No%20authorization%20code`,
  );
}
