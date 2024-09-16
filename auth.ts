import { createClient } from '@/utils/supabase/server'
import { Session } from '@/lib/types'

export async function auth(): Promise<Session | null> {
  const supabase = createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? ''
    }
  }
}
