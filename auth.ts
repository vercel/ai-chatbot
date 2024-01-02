import NextAuth, { type DefaultSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { getSupabaseClient } from './lib/utils'

declare module 'next-auth' {
  interface Session {
    user: {
      /** The user's id. */
      id: string
    } & DefaultSession['user']
  }
}

// enable anon user creation
// https://www.lightenna.com/tech/2023/use-nextauth-with-nextjs-app-router-for-anonymous-logins/
export const {
  handlers: { GET, POST },
  auth
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    })
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // if (account?.provider === "google" && profile?.email && profile?.email_verified) {
      //   return profile.email_verified && (profile.email.endsWith("@nuclaysolutions.com") || profile.email.endsWith("@givecentral.org"))
      // }

      if (profile) {
        const supabase = getSupabaseClient()
        const { data: user, error } = await supabase
          .from('users')
          .select(undefined, { head: true })
          .eq('email', profile.email)
          .maybeSingle()

        if(error) console.log('error fetching user', error)

        if (!user) {
          console.log('creating user')
          const { data, error } = await supabase.from('users').insert({
            email: profile.email,
            name: profile.name,
            profile_image: profile.picture
          })

          if (error) console.log('error creating user', error)
        }        
      }

      return true
    },
    async jwt({ token, user }) {
      // append database userid to token
      if (user) {
        const supabase = getSupabaseClient()
        const { data, error } = await supabase
          .from('users')
          .select()
          .eq('email', token.email)
          .limit(1)
          .single()

        if(error)  console.log('error fetching user', error)
        
        token.id = data.id
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
    }
  },
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  }
})
