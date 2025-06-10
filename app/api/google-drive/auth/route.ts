import { NextRequest, NextResponse } from 'next/server';
import { GoogleDriveService } from '@/lib/google-drive';

// Log the environment variables (without sensitive data)
console.log('Auth Route - Environment Check:');
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('Redirect URI:', `${process.env.NEXT_PUBLIC_APP_URL}/api/google-drive/auth`);

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.NEXT_PUBLIC_APP_URL) {
  throw new Error('Missing required environment variables for Google Drive integration');
}

const driveService = new GoogleDriveService(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/api/google-drive/auth`
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const codeVerifier = searchParams.get('code_verifier');

    console.log('Auth Route - Request:', {
      url: request.url,
      hasCode: !!code,
      hasCodeVerifier: !!codeVerifier,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    if (!code) {
      // Redirect to Google OAuth
      const { url: authUrl, codeVerifier } = await driveService.getAuthUrl();
      console.log('Auth Route - Redirecting to Google consent screen:', authUrl);
      
      // Return a 307 Temporary Redirect with the code verifier
      const response = NextResponse.redirect(authUrl);
      response.headers.set('Cache-Control', 'no-store');
      response.cookies.set('code_verifier', codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hour
      });
      return response;
    }

    // Get the code verifier from the cookie
    const storedCodeVerifier = request.cookies.get('code_verifier')?.value;
    if (!storedCodeVerifier) {
      throw new Error('No code verifier found in cookies');
    }

    // Exchange code for access token
    const accessToken = await driveService.getAccessToken(code, storedCodeVerifier);
    console.log('Auth Route - Successfully obtained access token');
    
    // Create a new URL for the home page
    const homeUrl = new URL('/', request.url);
    console.log('Auth Route - Redirecting to home page:', homeUrl.toString());
    
    // Create the response with the redirect
    const response = NextResponse.redirect(homeUrl);
    
    // Set the access token cookie
    response.cookies.set('google_drive_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600 // 1 hour
    });

    // Clear the code verifier cookie
    response.cookies.delete('code_verifier');

    // Set cache control headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: any) {
    console.error('Error in Google Drive auth:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Create a new URL for the error page
    const errorUrl = new URL('/?error=auth_failed', request.url);
    console.log('Auth Route - Redirecting to error page:', errorUrl.toString());
    
    // Return a redirect to the error page
    return NextResponse.redirect(errorUrl);
  }
} 