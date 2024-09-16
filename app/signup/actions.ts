'use server'

import { ResultCode } from '@/lib/utils'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
interface Result {
  type: string
  resultCode: ResultCode
}

export async function signup(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result | undefined> {
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
    const supabase = createClient()
    const origin = headers().get('origin')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`
      }
    })

    if (error) {
      return {
        type: 'error',
        resultCode: ResultCode.InvalidCredentials
      }
    }

    return {
      type: 'success',
      resultCode: ResultCode.UserCreated
    }
  }
}
