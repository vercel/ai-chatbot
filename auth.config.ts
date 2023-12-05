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
        const authEmailPattern = process.env.AUTH_EMAIL_PATTERN || ''
        const authEmailList = process.env.AUTH_AUTHORISED_EMAILS || ''

        // Check if the email matches the authorised email pattern
        if (!authEmailPattern || profile?.email?.endsWith(authEmailPattern)) {
          return true
        }

        // Check if the email matches any of the authorised email addresses
        if (authEmailList) {
          const authorisedList = authEmailList.split(',').map(item => item.trim())
          if (authorisedList.includes(profile.email)) {
            return true
          }
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
