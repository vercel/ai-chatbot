import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';
import { getBaseUrl, createAbsoluteUrl } from './lib/get-url';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Permite acesso direto à página inicial, /claude, /api/mcp e APIs temporariamente
  if (pathname === '/' || pathname.startsWith('/claude') || pathname.startsWith('/api/claude') || pathname.startsWith('/api/test') || pathname.startsWith('/api/mcp')) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  if (!token) {
    // Usa detecção automática para obter a URL base correta
    const baseUrl = getBaseUrl(request);
    
    // Constrói a URL correta usando o domínio detectado
    const correctUrl = `${baseUrl}${pathname}`;
    const redirectUrl = encodeURIComponent(correctUrl);
    
    // Cria URL de redirect usando o domínio correto detectado
    const guestAuthUrl = `${baseUrl}/api/auth/guest?redirectUrl=${redirectUrl}`;

    return NextResponse.redirect(new URL(guestAuthUrl));
  }

  const isGuest = guestRegex.test(token?.email ?? '');

  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    // Usa a URL base detectada para redirecionar para home
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(new URL('/', baseUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/chat/:id',
    '/claude',
    '/api/:path*',
    '/login',
    '/register',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
