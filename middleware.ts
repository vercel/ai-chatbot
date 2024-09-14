import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { clerkMiddleware } from '@clerk/nextjs/server'

// fix this
export default clerkMiddleware(() => {
  NextAuth(authConfig).auth
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
}
