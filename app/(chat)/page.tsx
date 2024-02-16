import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { handleChat } from '@/lib/providers/openai'

export default function IndexPage() {
  const id = nanoid()

  return <Chat id={id} api={handleChat} />
}
