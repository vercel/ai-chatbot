import { NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    const users = await getUser(email);
    
    return NextResponse.json({
      userExists: users.length > 0,
      userCount: users.length,
      hasPassword: users.length > 0 ? !!users[0].password : false,
      isAdmin: users.length > 0 ? users[0].isAdmin : false,
      email: email
    });
  } catch (error) {
    console.error('Debug user check failed:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      type: 'database_error'
    }, { status: 500 });
  }
}