import { clerkMiddleware } from '@clerk/nextjs/server'

// fix this
export default clerkMiddleware()

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
}
