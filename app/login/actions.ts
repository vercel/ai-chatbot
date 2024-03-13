'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { db } from '@vercel/postgres'
import { getStringFromBuffer } from '@/lib/utils'
import { z } from 'zod'

interface Result {
  type: string
  message: string
}

export async function authenticate(
  _prevState: Result | undefined,
  formData: FormData
) {
  try {
    const email = formData.get('email')
    const password = formData.get('password')

    await signIn('credentials', {
      email,
      password,
      redirectTo: '/'
    })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { type: 'error', message: 'Invalid credentials.' }
        default:
          return { type: 'error', message: 'Something went wrong.' }
      }
    }

    throw error
  }
}

export async function signup(
  _prevState: Result | undefined,
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
      message: 'Email and password must be at least 6 characters long.'
    }
  }
}
