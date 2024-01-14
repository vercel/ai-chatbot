import NextAuth from 'next-auth'
import authConfig from '@/auth.config'

export const { auth: middleware } = NextAuth(authConfig)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|auth|favicon.ico|favicon-16x16.png|apple-touch-icon.png).*)',
  ]
}