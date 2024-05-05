import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'
import { getMissingKeys } from '../actions'
import { currentUser } from '@clerk/nextjs/server'
import { getCurrentUser } from '@/lib/user.actions'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Next.js AI Chatbot'
}

export default async function IndexPage() {
  const user = await currentUser()
  if (!user) return null
  const userInfo = await getCurrentUser(user.id)
  if (!userInfo?.onboarded) redirect('/onboarding')
  const id = nanoid()
  const missingKeys = await getMissingKeys()

  return (
    <AI initialAIState={{ chatId: id, messages: [] }}>
      <Chat id={id} user={userInfo} missingKeys={missingKeys} />
    </AI>
  )
}
