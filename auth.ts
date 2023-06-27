import NextAuth, { type DefaultSession } from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { NextResponse } from 'next/server'

declare module 'next-auth' {
  interface Session {
    user: {
      /** The user's id. */
      id: string
    } & DefaultSession['user']
  }
}

export const {
  handlers: { GET, POST },
  auth,
  CSRF_experimental
} = NextAuth({
  providers: [GitHub],
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.id = profile.id
        token.image = profile.picture
      }
      return token
    },
    authorized({ auth }) {
      return !!auth?.user
    }
  },
  pages: {
    signIn: '/sign-in'
  }
})
