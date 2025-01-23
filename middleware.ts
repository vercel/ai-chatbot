import { ipAddress } from '@vercel/functions';
import { kv } from '@vercel/kv';
import { headers } from 'next/headers';
import { NextFetchEvent, NextRequest } from 'next/server';
import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

import { kasadaHandler } from './utils/kasada/kasada-server';

const MAX_REQUESTS = 25;

export const { auth } = NextAuth(authConfig);

export async function botProtectionMiddleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  if (['POST', 'DELETE'].includes(request.method)) {
    /*
     * NOTE: Do not pass server actions through bot protection
     */

    if (request.nextUrl.pathname === '/') {
      return undefined;
    }

    if (process.env.NODE_ENV === 'development') {
      return undefined;
    }

    const realIp = ipAddress(request) ?? 'no-ip';
    const pipeline = kv.pipeline();
    pipeline.incr(`rate-limit:${realIp}`);
    pipeline.expire(`rate-limit:${realIp}`, 60 * 60 * 24, 'NX');
    const [requests] = (await pipeline.exec()) as [number];

    if (requests > MAX_REQUESTS) {
      return new Response('Too many requests (rate limit)', { status: 429 });
    }

    return kasadaHandler(request, event);
  }
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const headersList = await headers();
  const botCheckBypassToken = headersList.get('x-vercel-protection-bypass');

  if (botCheckBypassToken === process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
    // @ts-expect-error TODO: fix type mismatch
    return auth(request, event);
  }

  const botProtectionResponse = await botProtectionMiddleware(request, event);
  if (botProtectionResponse) return botProtectionResponse;

  // @ts-expect-error TODO: fix type mismatch
  return auth(request, event);
}

export const config = {
  matcher: ['/', '/:id', '/api/:path*', '/login', '/register'],
};
