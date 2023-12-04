import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { handleChat } from './actions'

export default function IndexPage() {
  const id = nanoid()

  return <Chat id={id} action={handleChat} />
}
