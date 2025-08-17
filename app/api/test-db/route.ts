import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  try {
    // Test database connection by trying to query users table
    const users = await getUser('test@example.com');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      hasUsers: users.length > 0
    });
  } catch (error) {
    console.error('Database test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'database_error'
    }, { status: 500 });
  }
}