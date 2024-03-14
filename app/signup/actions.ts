'use server'

import { signIn } from '@/auth'
import { db } from '@vercel/postgres'
import { getStringFromBuffer } from '@/lib/utils'
import { z } from 'zod'
import { AuthResult } from '@/lib/types'

export async function signup(
  _prevState: AuthResult | undefined,
  formData: FormData
) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const parsedCredentials = z
    .object({
      email: z.string().email(),
      password: z.string().min(6)
    })
    .safeParse({
      email,
      password
    })

  if (parsedCredentials.success) {
    const salt = crypto.randomUUID()

    const encoder = new TextEncoder()
    const saltedPassword = encoder.encode(password + salt)
    const hashedPasswordBuffer = await crypto.subtle.digest(
      'SHA-256',
      saltedPassword
    )
    const hashedPassword = getStringFromBuffer(hashedPasswordBuffer)

    const client = await db.connect()

    try {
      await client.sql`
              INSERT INTO users (email, password, salt)
              VALUES (${email}, ${hashedPassword}, ${salt})
              ON CONFLICT (id) DO NOTHING;
            `

      await signIn('credentials', {
        email,
        password,
        redirect: false
      })

      return { type: 'success', message: 'Account created!' }
    } catch (error) {
      const { message } = error as Error

      if (
        message.startsWith('duplicate key value violates unique constraint')
      ) {
        return { type: 'error', message: 'User already exists! Please log in.' }
      } else {
        return {
          type: 'error',
          message: 'Something went wrong! Please try again.'
        }
      }
    } finally {
      client.release()
    }
  } else {
    return {
      type: 'error',
      message: 'Invalid entries, please try again!'
    }
  }
}
