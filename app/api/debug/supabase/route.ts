import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        error: 'Email and password required' 
      }, { status: 400 });
    }

    console.log('[SUPABASE DEBUG] Testing Supabase client connection...');
    
    // Check if environment variables exist
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase configuration missing',
        debug: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          urlPrefix: supabaseUrl?.substring(0, 30),
          keyPrefix: supabaseKey?.substring(0, 20)
        }
      }, { status: 500 });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });

    // Test database connection by fetching user
    console.log('[SUPABASE DEBUG] Fetching user:', email);
    const { data: users, error: fetchError } = await supabase
      .from('User')  // Capital U - matching the table name in schema
      .select('*')
      .eq('email', email);

    if (fetchError) {
      console.error('[SUPABASE DEBUG] Error fetching user:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch user',
        debug: {
          supabaseError: fetchError.message,
          code: fetchError.code,
          details: fetchError.details
        }
      }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No user found',
        debug: {
          email,
          usersFound: 0
        }
      });
    }

    const user = users[0];
    console.log('[SUPABASE DEBUG] User found:', { 
      id: user.id, 
      email: user.email,
      hasPassword: !!user.password 
    });

    // Test password comparison using bcryptjs
    const { compare } = await import('bcryptjs');
    const passwordsMatch = await compare(password, user.password);

    return NextResponse.json({
      success: passwordsMatch,
      message: passwordsMatch ? 'Authentication successful' : 'Invalid password',
      debug: {
        userFound: true,
        userId: user.id,
        email: user.email,
        hasPassword: !!user.password,
        passwordMatch: passwordsMatch,
        usingSupabaseClient: true
      }
    });

  } catch (error) {
    console.error('[SUPABASE DEBUG] Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      debug: {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}