import { NextResponse, NextRequest } from 'next/server';

import { createUser } from './db/queries';

export async function middleware(request: NextRequest) {
  const user = request.cookies.get('user')?.value;

  const response = NextResponse.next();

  if (user) {
    return response;
  }

  const createdUser = await createUser();
  response.cookies.set('user', createdUser[0].id);

  return response;
}

export const config = {
  matcher: ['/', '/:id', '/api/:path*'],
};
