import { NextResponse } from 'next/server';

export async function GET() {
  const issuer =
    process.env.WORKOS_ISSUER ??
    'https://intentional-oil-65-staging.authkit.app';
  return NextResponse.redirect(
    `${issuer}/.well-known/oauth-authorization-server`,
    { status: 302 },
  );
}
