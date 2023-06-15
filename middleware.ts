import { authMiddleware } from '@clerk/nextjs'

// @see https://clerk.dev
export default authMiddleware()

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
}
