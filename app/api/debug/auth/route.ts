import { NextRequest, NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import { getUser } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password required',
        debug: {
          email: !!email,
          password: !!password
        }
      }, { status: 400 });
    }

    console.log('[DEBUG] Auth debug endpoint called for:', email);
    console.log('[DEBUG] Environment:', process.env.NODE_ENV);

    // Test database connection
    console.log('[DEBUG] Testing database connection...');
    const users = await getUser(email);
    console.log('[DEBUG] Database query result - users found:', users.length);

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No user found with this email',
        debug: {
          environment: process.env.NODE_ENV,
          databaseConnected: true,
          userFound: false,
          email
        }
      });
    }

    const [user] = users;
    console.log('[DEBUG] User found:', {
      id: user.id,
      email: user.email,
      hasPassword: !!user.password,
      passwordHashPrefix: user.password?.substring(0, 10) + '...'
    });

    if (!user.password) {
      return NextResponse.json({
        success: false,
        message: 'User has no password hash',
        debug: {
          environment: process.env.NODE_ENV,
          databaseConnected: true,
          userFound: true,
          hasPassword: false,
          userId: user.id
        }
      });
    }

    // Test password comparison
    console.log('[DEBUG] Testing password comparison...');
    const startTime = Date.now();
    const passwordsMatch = await compare(password, user.password);
    const comparisonTime = Date.now() - startTime;
    
    console.log('[DEBUG] Password comparison result:', passwordsMatch);
    console.log('[DEBUG] Comparison took:', comparisonTime, 'ms');

    return NextResponse.json({
      success: passwordsMatch,
      message: passwordsMatch ? 'Password matches' : 'Password does not match',
      debug: {
        environment: process.env.NODE_ENV,
        databaseConnected: true,
        userFound: true,
        hasPassword: true,
        passwordMatch: passwordsMatch,
        comparisonTimeMs: comparisonTime,
        userId: user.id,
        hashAlgorithm: 'bcryptjs',
        hashPrefix: user.password.substring(0, 10) + '...'
      }
    });

  } catch (error) {
    console.error('[DEBUG] Error in auth debug endpoint:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      debug: {
        environment: process.env.NODE_ENV,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}