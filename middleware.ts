import { NextRequest, NextResponse } from 'next/server';
import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

const authMiddleware = NextAuth(authConfig).auth;

export default function middleware(req: NextRequest, res: NextResponse) {
  const match = req.nextUrl.pathname.match(/^\/chat\/([^\/]+)$/);

  if (match) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('id', match[1]);
    return NextResponse.rewrite(url);
  }

  return authMiddleware(req as any, res as any);
}

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register', '/chat/:id*'],
};
