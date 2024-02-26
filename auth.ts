import NextAuth, { type DefaultSession } from 'next-auth'
import { headers } from 'next/headers';
import CredentialsProvider from "next-auth/providers/credentials"
// import { SiweMessage } from "siwe"
import { SigninMessage } from './utils/signMessage';

declare module 'next-auth' {
  interface Session {
    user: {
      /** The user's id. */
      id: string
    } & DefaultSession['user']
  }
}

const providers = [
  CredentialsProvider({
    name: "Solana",
    credentials: {
      message: {
        label: "Message",
        type: "text",
        placeholder: "0x0",
      },
      signature: {
        label: "Signature",
        type: "text",
        placeholder: "0x0",
      },
      nonce: {
        label: "Nonce",
        type: "text",
      }
    },
    async authorize(credentials) {
      try {
        const msg = credentials?.message;
        const siws = new SigninMessage(JSON.parse(msg ? (msg as string) : '{}'))
        const signature = credentials?.signature;
        const result = await siws.validate(signature ? (signature as string) : '',)
        if (result) {
          return {
            id: siws.publicKey,
          }
        }
        return null
      } catch (e) {
        return null
      }
    },
  }),
]

export const {
  handlers: { GET, POST },
  auth
} = NextAuth({
  providers,
  callbacks: {
    jwt({ token, profile }) {
      if (profile) {
        token.id = profile.id
        token.image = profile.avatar_url || profile.picture
      }
      return token
    },
    session: ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = String(token.sub)
      }
      return session
    },
    authorized({ auth }) {
      return !!auth?.user // this ensures there is a logged in user for -every- request
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      return baseUrl
    }
  },
  pages: {
    signIn: '/sign-in' // overrides the next-auth default signin page https://authjs.dev/guides/basics/pages
  }
})
