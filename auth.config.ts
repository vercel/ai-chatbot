import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'

import type { NextAuthConfig, DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      /** The user's id. */
      id: string
    } & DefaultSession['user']
  }
}

const getEnabledProviders = () => {
  const enabledProviders = []

  if (process.env.AUTH_GITHUB_ENABLED === 'true') {
    enabledProviders.push(GitHub)
  }

  if (process.env.AUTH_GOOGLE_ENABLED === 'true') {
    enabledProviders.push(Google)
  }

  return enabledProviders
}

export default {
  providers: getEnabledProviders(),
  callbacks: {
    jwt({ token, profile }) {
      if (profile?.id) { // GitHub profiles have an 'id' field
        token.id = String(profile.id)
        token.image = profile.avatar_url || profile.picture
      } else if (profile?.sub) { // Google profiles have a 'sub' field
        token.id = String(profile.sub)
        token.image = profile.picture
      }
      return token
    },
    session: ({ session, token }) => {
      if (session?.user && token?.id) {
        session.user.id = String(token.id)
      }
      return session
    },
    authorized({ auth }) {
      return !!auth?.user // this ensures there is a logged in user for -every- request
    },
    signIn({ profile }) {
      if (process.env.AUTH_SSO_ENABLED === 'false' && profile?.email) {
        return true
      }
      if (!profile?.email) {
        return false
      } else {
        const emailMatchPattern = process.env.AUTH_EMAIL_PATTERN || ''
        if (!emailMatchPattern || profile?.email?.endsWith(emailMatchPattern)) {
          return true
        }
        return false
      }
    }
  },
  pages: {
    signIn: '/auth/signin', // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
    error: '/auth/error'
  }
} satisfies NextAuthConfig
