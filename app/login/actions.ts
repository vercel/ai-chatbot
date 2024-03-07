'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import { db } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData
) {
  try {
    const email = formData.get('email')
    const password = formData.get('password')
    await signIn('credentials', { email, password, redirectTo: '/' })
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.'
        default:
          return 'Something went wrong.'
      }
    }

    throw error
  }
}

export async function signup(
  _prevState: string | undefined,
  formData: FormData
) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const hashedPassword = await bcrypt.hash(password, 10)

  const client = await db.connect()

  try {
    await client.sql`
        INSERT INTO users (email, password)
        VALUES (${email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `

    return 'User created! Please log in.'
  } catch (error) {
    const { message } = error as Error

    if (message.startsWith('duplicate key value violates unique constraint')) {
      return 'User already exists! Please log in.'
    } else {
      return 'Something went wrong! Please try again.'
    }
  } finally {
    client.release()
  }
}
