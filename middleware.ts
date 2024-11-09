import { NextResponse, NextRequest } from 'next/server';

import { generateUUID } from '@/lib/utils';

export function middleware(request: NextRequest) {
  const user = request.cookies.get('user')?.value;

  const response = NextResponse.next();

  if (user) {
    return response;
  }

  response.cookies.set('user', generateUUID());

  return response;
}

export const config = {
  matcher: ['/', '/:id', '/api/:path*'],
};
