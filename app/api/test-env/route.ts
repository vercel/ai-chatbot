import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    clientId: process.env.CIVIC_CLIENT_ID 
  });
} 