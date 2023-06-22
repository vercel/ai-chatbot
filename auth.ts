import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

export const {
  handlers: { GET, POST },
  auth,
  CSRF_experimental
  // @ts-ignore
} = NextAuth({
  // @ts-ignore
  providers: [GitHub],
  callbacks: {
    // @ts-ignore
    jwt: async ({ token, profile }) => {
      if (profile?.id) {
        token.id = profile.id
        token.image = profile.picture
      }
      return token
    },
    // @ts-ignore
    authorized({ auth }) {
      return !!auth?.user
    }
  },
  pages: {
    signIn: '/sign-in'
  }
})
