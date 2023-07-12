import NextAuth, { type DefaultSession } from 'next-auth'
import { NextAuthRequest } from 'next-auth/lib'
import { Session } from 'next-auth/types'
// import GitHub from 'next-auth/providers/github'

declare module 'next-auth' {
  interface Session {
    user: {
      /** The user's id. */
      id: string
    } & DefaultSession['user']
  }
}

// export const {
//   handlers: { GET, POST },
//   auth,
//   CSRF_experimental // will be removed in future
// } = 


// function LocalNextAuth() : 

export const {
  handlers: { GET, POST },
  auth,
  CSRF_experimental // will be removed in future
} = NextAuth({
  providers: [],
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.id = profile.id
        token.image = profile.picture
      }
      return token
    },
    authorized({ auth }) {
      return true // this ensures there is a logged in user for -every- request
    }
  }
})
