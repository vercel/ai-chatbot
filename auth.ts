import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import Google from 'next-auth/providers/google'

export const {
  handlers: { GET, POST },
  auth,
  CSRF_experimental
  // @ts-ignore
} = NextAuth({
  // @ts-ignore
  providers: [GitHub, Google],
  callbacks: {
    // @ts-ignore
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
