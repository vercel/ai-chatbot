import { authMiddleware } from '@clerk/nextjs'

// @see https://clerk.dev
export default authMiddleware({
  publicRoutes: ['/share/:id']
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
}
