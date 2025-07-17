import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    resource: process.env.WORKOS_API_URL || 'https://servant-ai.vercel.app',
    authorization_servers: [
      process.env.WORKOS_ISSUER ||
        'https://intentional-oil-65-staging.authkit.app',
    ],
    bearer_methods_supported: ['header'],
  });
}
