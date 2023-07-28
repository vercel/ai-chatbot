import 'server-only'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const auth = async ({
  cookieStore
}: {
  cookieStore: ReturnType<typeof cookies>
}) => {
  // Create a Supabase client configured to use cookies
  const supabase = createServerComponentClient({
    cookies: () => cookieStore
  })
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}
