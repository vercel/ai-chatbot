import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET() {
  try {
    console.log('[DB DEBUG] Testing database connection...');
    console.log('[DB DEBUG] POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
    console.log('[DB DEBUG] POSTGRES_URL prefix:', process.env.POSTGRES_URL?.substring(0, 20) + '...');

    const client = postgres(process.env.POSTGRES_URL!);
    
    // Test basic connection
    const result = await client`SELECT NOW() as current_time`;
    console.log('[DB DEBUG] Basic query successful:', result);

    // Test user table exists
    const tableCheck = await client`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'user'
    `;
    console.log('[DB DEBUG] User table check:', tableCheck);

    // Test user count
    const userCount = await client`SELECT COUNT(*) as count FROM "user"`;
    console.log('[DB DEBUG] User count:', userCount);

    // Test specific user
    const specificUser = await client`
      SELECT id, email FROM "user" 
      WHERE email = 'matthew@measurelab.co.uk'
    `;
    console.log('[DB DEBUG] Specific user search:', specificUser);

    await client.end();

    return NextResponse.json({
      success: true,
      debug: {
        environment: process.env.NODE_ENV,
        postgresUrlExists: !!process.env.POSTGRES_URL,
        basicQuery: result[0],
        userTableExists: tableCheck.length > 0,
        userCount: userCount[0].count,
        specificUserFound: specificUser.length > 0,
        specificUser: specificUser[0] || null
      }
    });

  } catch (error) {
    console.error('[DB DEBUG] Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        environment: process.env.NODE_ENV,
        postgresUrlExists: !!process.env.POSTGRES_URL,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorStack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}