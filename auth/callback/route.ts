import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/"; // Include 'next' redirect param handling

  if (code) {
    const supabase = await createClient();

    // Exchange code for session
    const { data: sessionData, error: exchangeError } = await supabase.auth
      .exchangeCodeForSession(code);

    if (exchangeError) {
      console.error(
        "Auth Callback Error - Code Exchange:",
        exchangeError.message,
      );
      // Redirect to an error page or login, including the original error message potentially
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/auth-code-error?error=${
          encodeURIComponent(exchangeError.message)
        }`,
      );
    }

    // Check if session and refresh token exist after exchange
    if (sessionData?.session?.provider_refresh_token && sessionData?.user?.id) {
      const refreshToken = sessionData.session.provider_refresh_token;
      const userId = sessionData.user.id;

      console.log(
        `Auth Callback: Attempting to save refresh token for user ${userId}`,
      ); // Add log
      // Log the actual token value (or its type/length for security if preferred)
      console.log(
        `Auth Callback: Refresh Token Value Type: ${typeof refreshToken}, Length: ${
          refreshToken?.length ?? 0
        }`,
      );

      // Save the refresh token to the User_Profiles table
      // Ensure your table name matches exactly (case-sensitive if quoted)
      // Use double quotes for case-sensitive table names
      const { data: updateData, error: updateError } = await supabase
        .from('"User_Profiles"')
        .update({ google_refresh_token: refreshToken })
        .eq("id", userId);

      if (updateError) {
        // Log the error but continue the login flow
        console.error(
          `Auth Callback Error - Saving Refresh Token for user ${userId}:`,
          updateError.message,
        );
      } else {
        // Log success and the data returned by the update
        console.log(
          `Auth Callback: Update reported success for user ${userId}. Returned data:`,
          JSON.stringify(updateData), // Log the data returned by update
        );
      }
    } else if (!sessionData?.session) {
      // This case should ideally not happen if exchange succeeded without error
      console.error(
        "Auth Callback Error: Session data unexpectedly missing after successful code exchange.",
      );
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/auth-code-error?error=Session%20data%20missing`,
      );
    } else if (!sessionData?.session?.provider_refresh_token) {
      // Log if the refresh token wasn't provided by Google/Supabase
      console.warn(
        `Auth Callback Warning: provider_refresh_token missing in session for user ${sessionData?.user?.id}. Offline access might not be possible.`,
      );
    }

    // Redirect to the originally intended path or home page
    console.log(`Auth Callback: Redirecting to ${next}`); // Add log
    return NextResponse.redirect(`${requestUrl.origin}${next}`);
  }

  // If no code is present in the URL, redirect to an error page
  console.error("Auth Callback Error: No code parameter found in URL.");
  return NextResponse.redirect(
    `${requestUrl.origin}/auth/auth-code-error?error=No%20authorization%20code`,
  );
}
