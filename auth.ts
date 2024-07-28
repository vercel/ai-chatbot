import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { z } from 'zod'
import { getStringFromBuffer } from './lib/utils'
import { getUser } from './app/login/actions'

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log('IN AUTHROIZE')
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6)
          })
          .safeParse(credentials)

        

        if (parsedCredentials.success) {
          console.log('PARSEDCREDENTIALS WAS SUCCCESS, cALLING GETUSER')
          const { email, password } = parsedCredentials.data
          const user = await getUser(email)
          console.log('GETUSER RETURNED ', user);

          if (!user) return null

          const encoder = new TextEncoder()
          const saltedPassword = encoder.encode(password + user.salt)
          const hashedPasswordBuffer = await crypto.subtle.digest(
            'SHA-256',
            saltedPassword
          )
          const hashedPassword = getStringFromBuffer(hashedPasswordBuffer)

          if (hashedPassword === user.password) {
            console.log('USER WAS NOT NULL AND CORRECT PW')
            return user
          } else {
            console.log('USER WAS NOT NULL BUT INC PW')
            return null
          }
        }

        return null
      }
    })
  ]
})
