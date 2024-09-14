import { getMissingKeys } from '@/app/actions'
import { Chat } from '@/components/chat'
import { AI } from '@/lib/chat/actions'

export interface ChatPageProps {
  params: {
    id: string
  }
}

export default async function ChatPage() {
  const missingKeys = await getMissingKeys()

  return (
    <AI>
      <Chat missingKeys={missingKeys} />
    </AI>
  )
}
