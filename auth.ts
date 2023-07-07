import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const auth = async () => {
  // Create a Supabase client configured to use cookies
  const supabase = createServerActionClient({ cookies })
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}
