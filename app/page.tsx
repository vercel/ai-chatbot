import { Chat } from './chat'
import { Sidebar } from './sidebar'
import { auth } from '@/auth'

export const runtime = 'edge'
export const preferredRegion = 'home'

export default async function IndexPage() {
  const session = await auth()
  return (
    <div className="relative flex h-full w-full overflow-hidden">
      <Sidebar session={session} newChat />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <Chat />
      </div>
    </div>
  )
}
