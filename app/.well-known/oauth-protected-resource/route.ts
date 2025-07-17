import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    resource: process.env.WORKOS_API_URL || 'https://api.workos.com',
    authorization_servers: [
      process.env.WORKOS_ISSUER || 'https://api.workos.com'
    ]
  });
}