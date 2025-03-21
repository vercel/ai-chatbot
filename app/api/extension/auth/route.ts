import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcrypt-ts';
import { SignJWT } from 'jose';
import { nanoid } from 'nanoid';
import { getUser } from '@/lib/db/queries';

// Secret key for JWT signing (use a strong secret in production)
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'fallback-secret-for-extension-auth-do-not-use-in-production'
);

/**
 * Extension authentication endpoint - handles login for the Chrome extension
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Get the user from the database
    const users = await getUser(email);
    
    // Check if the user exists
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const user = users[0];
    
    // Check if the password matches
    const passwordsMatch = await compare(password, user.password || '');
    
    if (!passwordsMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Create a JWT token - valid for 7 days
    const token = await new SignJWT({ 
      id: user.id,
      email: user.email,
      sub: user.id,
      jti: nanoid()
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Error in extension auth:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Authentication failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * Validate token endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('Authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid token' },
        { status: 401 }
      );
    }
    
    // Token validation will be done in middleware - this endpoint is just for checking
    return NextResponse.json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { success: false, error: 'Token validation failed' },
      { status: 401 }
    );
  }
}
