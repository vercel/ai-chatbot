import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';


export async function GET(request: Request) {
  // The /auth/callback route is required for the server-side auth flow implemented
  // by the Auth Helpers package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-sign-in-with-code-exchange
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;
  const supabase = await createClient(); // Create client once

  // --- Get IP Address ---
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded
    ? forwarded.split(/, /)[0]
    : request.headers.get('x-real-ip'); // Fallback to x-real-ip or request.ip could be used
  console.log(
    Auth Callback: Request IP Address detected: ${ipAddress ?? 'Not Found'},
  );
  // --- End Get IP Address ---

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
        Auth Callback: Processing successful exchange for user ${userId} (${userEmail}),
      );
      // DETAILED LOG: Check if refresh token exists in session
      console.log(
        Auth Callback DEBUG: Refresh Token present in session for user ${userId}?,
        !!refreshToken,
      );
      if (refreshToken) {
        // Optionally log the first few chars of the token for verification, but be careful with logging sensitive data
        // console.log(Auth Callback DEBUG: Refresh Token starts with: ${refreshToken.substring(0, 5)}...);
      }

      // --- Check if User is New ---
      let isNewUser = false;
      try {
        const { data: existingProfile, error: profileCheckError } =
          await supabase
            .from('User_Profiles')
            .select('id', { count: 'exact', head: true }) // More efficient: only check existence
            .eq('id', userId)
            .limit(1); // Ensure only one row is checked

        if (profileCheckError) {
          console.error(
            Auth Callback Error - Checking User_Profiles existence for ${userId}:,
            profileCheckError,
          );
          // Cannot determine if new, assume not new to be safe and avoid duplicate webhooks
          isNewUser = false;
        } else {
          // If count is 0, the user profile doesn't exist yet.
          // Note: This relies on the profile being created very shortly after Supabase auth user creation.
          // A safer check might be comparing user.created_at with current time or a dedicated flag.
          // For simplicity, we use profile existence check.
          isNewUser = !existingProfile;
          console.log(
            Auth Callback: User ${userId} is determined to be ${isNewUser ? 'NEW' : 'EXISTING'} based on profile check.,
          );
        }
      } catch (profileCheckCatchError) {
        console.error(
          Auth Callback EXCEPTION - Checking User_Profiles existence for ${userId}:,
          profileCheckCatchError,
        );
        isNewUser = false; // Assume not new on error
      }
      // --- End Check if User is New ---

      // 1. Save Google Refresh Token to User Profile (if it exists)
      if (refreshToken) {
        // DETAILED LOG: Log the length of the token before attempting to save
        console.log(
          Auth Callback DEBUG: Refresh Token received. Length: ${refreshToken.length}. Attempting save for user ${userId},
        );
        console.log(
          Auth Callback DEBUG: Attempting to update User_Profiles for user ${userId},
        );
        try {
          const { data: updateData, error: profileUpdateError } = await supabase
            .from('User_Profiles') // Target the User_Profiles table
            .update({ google_refresh_token: refreshToken }) // Update the specific column
            .eq('id', userId) // Match the user ID using the 'id' column
            .select(); // Add .select() to potentially get more info on error/success

          // DETAILED LOG: Log the outcome of the update attempt
          console.log(
            Auth Callback DEBUG: Update result for user ${userId}:,
            { updateData, profileUpdateError },
          );

          if (profileUpdateError) {
            console.error(
              Auth Callback Error - Saving Refresh Token to Profile for user ${userId}:,
              profileUpdateError,
            );
            // Log error but continue
          } else {
            console.log(
              Auth Callback: Successfully saved Google refresh token to profile for user ${userId}.,
            );
          }
        } catch (profileUpdateCatchError) {
          console.error(
            Auth Callback EXCEPTION - Saving Refresh Token to Profile for user ${userId}:,
            profileUpdateCatchError,
          );
          // Log error but continue
        }
      } else {
        console.log(
          Auth Callback: No provider_refresh_token found in session for user ${userId}. Skipping profile update.,
        );
      }

      // 2. Call Webhook - ONLY IF isNewUser is true
      if (isNewUser) {
        console.log(
          Auth Callback: Attempting to call SIGNUP webhook for NEW user ${userId}.,
        );
        try {
          const webhookUrl =
            process.env.SIGNUP_WEBHOOK_URL ||
            'https://n8n-naps.onrender.com/webhook/64fc6422-135f-4e81-bd23-8fc61daee99e'; // Use env variable, fallback for safety
          const payload = {
            user_id: userId,
            email: userEmail,
            phone: user.phone ?? null,
            created_at: user.created_at,
            updated_at: user.updated_at, // Should be same as created_at for new user
            ip_address: ipAddress, // Add the IP address
            raw_user_meta_data: user.user_metadata ?? {},
            raw_app_meta_data: user.app_metadata ?? {},
            provider_tokens: {
              access_token: providerToken,
              // Only include refresh token if it exists, might not always be present
              refresh_token: refreshToken ?? undefined,
            },
          };

          console.log(
            Auth Callback: Calling SIGNUP webhook for user ${userId} with IP ${ipAddress}. URL: ${webhookUrl},
          );
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorBody = await response.text();
            console.error(
              Auth Callback Error - SIGNUP Webhook failed for user ${userId}: ${response.status} ${response.statusText},
              errorBody,
            );
          } else {
            console.log(
              Auth Callback: Successfully sent SIGNUP webhook for user ${userId}. Status: ${response.status},
            );
          }
        } catch (webhookCatchError) {
          console.error(
            Auth Callback EXCEPTION - Calling SIGNUP webhook for user ${userId}:,
            webhookCatchError,
          );
        }
      } else {
        console.log(
          Auth Callback: Skipping SIGNUP webhook for returning user ${userId}.,
        );
      }
      // --- END: Modified Webhook Logic ---

      // URL to redirect to after sign in process completes
      console.log(Auth Callback: Redirecting user ${userId} to ${origin}/);
      return NextResponse.redirect(${origin}/); // Redirect to home page on success
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
    ${origin}/login?error=${encodeURIComponent(supabaseError ?? 'Could not authenticate user')},
  ); // Redirect back to login on error
}