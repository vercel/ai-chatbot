'use server'

import { signIn } from '@/auth'
import { AuthResult } from '@/lib/types'
import { AuthError } from 'next-auth'
import { z } from 'zod'

export async function authenticate(
  _prevState: AuthResult | undefined,
  formData: FormData
) {
  try {
    const email = formData.get('email')
    const password = formData.get('password')

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
      await signIn('credentials', {
        email,
        password,
        redirectTo: '/'
      })
    } else {
      return { type: 'error', message: 'Invalid credentials!' }
    }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { type: 'error', message: 'Invalid credentials!' }
        default:
          return {
            type: 'error',
            message: 'Something went wrong, please try again!'
          }
      }
    }

    throw error
  }
}
