import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

// Secret key for JWT verification (must match the one used to sign the tokens)
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-for-extension-auth-do-not-use-in-production'
);

/**
 * Verify an extension token from the Authorization header
 */
export async function verifyExtensionToken(request: NextRequest): Promise<{ 
  valid: boolean; 
  userId?: string;
  error?: string;
}> {
  try {
    // Get the authorization header
    const authorization = request.headers.get('Authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return { valid: false, error: 'Missing or invalid token' };
    }
    
    // Extract the token
    const token = authorization.substring(7);
    
    // Verify the token
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Check if the user ID exists
    if (!payload.id) {
      return { valid: false, error: 'Invalid token payload' };
    }
    
    // Return the user ID
    return { valid: true, userId: payload.id as string };
  } catch (error) {
    console.error('Error verifying extension token:', error);
    return { 
      valid: false, 
      error: `Token verification failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Middleware to authenticate extension requests
 * Use this in API endpoints that need extension authentication
 */
export async function authenticateExtensionRequest(
  request: NextRequest,
  handler: (userId: string, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Verify the token
  const { valid, userId, error } = await verifyExtensionToken(request);
  
  if (!valid || !userId) {
    return NextResponse.json(
      { success: false, error: error || 'Authentication failed' },
      { status: 401 }
    );
  }
  
  // Call the handler with the user ID
  return handler(userId, request);
}
