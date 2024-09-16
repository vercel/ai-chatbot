'use server'

import { z } from 'zod'
import { ResultCode } from '@/lib/utils'
import { createClient } from '@/utils/supabase/server'

interface Result {
  type: string
  resultCode: ResultCode
}

export async function authenticate(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result | undefined> {
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
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email: parsedCredentials.data.email,
      password: parsedCredentials.data.password
    })

    if (error) {
      return {
        type: 'error',
        resultCode: ResultCode.InvalidCredentials
      }
    }

    return {
      type: 'success',
      resultCode: ResultCode.UserLoggedIn
    }
  } else {
    return {
      type: 'error',
      resultCode: ResultCode.InvalidCredentials
    }
  }
}
