import NextAuth, { type DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      id: string
    } & DefaultSession['user']
  }
}

export const {
  handlers: { GET, POST },
  auth,
  CSRF_experimental
} = NextAuth({
  // @ts-ignore
  providers: [GitHub],
  callbacks: {
    jwt: async ({ token, profile }) => {
      if (profile?.id) {
        token.id = profile.id
        token.image = profile.picture
      }
      return token
    }
    // @TODO
    // authorized({ request, auth }) {
    //   return !!auth?.user
    // }
  },
  pages: {
    signIn: '/sign-in'
  }
})
