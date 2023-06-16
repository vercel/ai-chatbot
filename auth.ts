import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'

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
  },
  pages: {
    signIn: '/sign-in'
  }
})
