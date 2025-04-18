import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { UUID } from 'node:crypto';

// Helper function to insert logs into the debug table
async function logToSupabase(supabase: any, logData: any) {
  try {
    const { error } = await supabase
      .from('callback_debug_logs')
      .insert([logData]);
    if (error) {
      console.error('Failed to insert log into Supabase table:', error);
      // Log failure to console, but don't block main flow
    }
  } catch (e) {
    console.error('Exception during Supabase log insert:', e);
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  const supabase = await createClient(); // Create client once

  // Define the type for the log entry explicitly
  type LogEntry = {
    user_id: string | null;
    email: string | null;
    provider_token_present: boolean | null;
    provider_refresh_token_present: boolean | null;
    exchange_error_message: string | null;
    save_token_error_message: string | null;
    webhook_error_message: string | null;
    notes: string | null;
  };

  let logEntry: LogEntry = {
    // Initialize log entry with the defined type
    user_id: null,
    email: null,
    provider_token_present: null,
    provider_refresh_token_present: null,
    exchange_error_message: null,
    save_token_error_message: null,
    webhook_error_message: null,
    notes: 'Initiating callback processing',
  };

  if (code) {
    try {
      // --- Log attempt *before* code exchange ---
      logEntry.notes =
        'Callback initiated, attempting first log before exchange';
      await logToSupabase(supabase, { ...logEntry });
      // --- End pre-exchange log ---

      // Wrap main logic in try-catch for logging
      // Exchange code for session
      // logEntry.notes = 'Attempting code exchange...'; // Note updated below
      // await logToSupabase(supabase, logEntry); // Optional: Log before exchange - MOVED EARLIER

      const { data: sessionData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);

      // --- Log critical info to DB table ---
      logEntry.exchange_error_message = exchangeError?.message ?? null;
      logEntry.provider_token_present = !!sessionData?.session?.provider_token;
      logEntry.provider_refresh_token_present =
        !!sessionData?.session?.provider_refresh_token;
      logEntry.user_id = sessionData?.user?.id ?? null;
      logEntry.email = sessionData?.user?.email ?? null;
      logEntry.notes = 'Code exchange finished. Proceeding...';
      await logToSupabase(supabase, { ...logEntry }); // Log state after exchange
      // --- End DB table logging ---

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
              logEntry.save_token_error_message = dbError.message;
              await logToSupabase(supabase, {
                ...logEntry,
                notes: 'Error saving tokens',
              });
            } else {
              console.log(
                `Auth Callback: Successfully saved provider tokens for user ${userId}.`,
              );
              logEntry.notes = 'Successfully saved tokens';
              await logToSupabase(supabase, { ...logEntry });
            }
          } catch (dbCatchError) {
            console.error(
              `Auth Callback EXCEPTION - Saving Tokens for user ${userId}:`,
              dbCatchError,
            );
            logEntry.save_token_error_message =
              dbCatchError instanceof Error
                ? dbCatchError.message
                : String(dbCatchError);
            await logToSupabase(supabase, {
              ...logEntry,
              notes: 'Exception saving tokens',
            });
          }
        } else {
          console.log(
            `Auth Callback: No provider_token or provider_refresh_token found in session for user ${userId}. Skipping token save.`,
          );
          logEntry.notes = 'Skipped token save (tokens not present)';
          await logToSupabase(supabase, { ...logEntry });
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
            logEntry.webhook_error_message = `${response.status} ${response.statusText}: ${errorBody}`;
            await logToSupabase(supabase, {
              ...logEntry,
              notes: 'Webhook call failed',
            });
          } else {
            console.log(
              `Auth Callback: Successfully sent webhook for user ${userId}. Status: ${response.status}`,
            );
            logEntry.notes = 'Webhook call successful';
            await logToSupabase(supabase, { ...logEntry });
          }
        } catch (webhookCatchError) {
          console.error(
            `Auth Callback EXCEPTION - Calling webhook for user ${userId}:`,
            webhookCatchError,
          );
          logEntry.webhook_error_message =
            webhookCatchError instanceof Error
              ? webhookCatchError.message
              : String(webhookCatchError);
          await logToSupabase(supabase, {
            ...logEntry,
            notes: 'Webhook call exception',
          });
        }
      } else {
        // Handle cases where session/user might be unexpectedly null after exchange
        console.error(
          'Auth Callback Error: Session or User data unexpectedly missing after successful code exchange.',
        );
        logEntry.notes = 'Session or User data missing after exchange';
        await logToSupabase(supabase, logEntry);
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
    } catch (error) {
      console.error(
        'Auth Callback EXCEPTION - General processing error:',
        error,
      );
      logEntry.notes = 'General exception during callback processing';
      logEntry.exchange_error_message =
        error instanceof Error ? error.message : String(error);
      await logToSupabase(supabase, logEntry); // Log the general error
      // Redirect to a generic error page
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/auth-code-error?error=Callback%20processing%20failed`,
      );
    }
  } // End if(code)

  // Fallback redirect if no code
  console.error('Auth Callback Error: No code parameter found in URL.');
  logEntry.notes = 'No authorization code found in URL';
  await logToSupabase(supabase, logEntry);
  return NextResponse.redirect(
    `${requestUrl.origin}/auth/auth-code-error?error=No%20authorization%20code`,
  );
}
