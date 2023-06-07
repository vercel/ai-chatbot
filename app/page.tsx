import { type Message } from 'ai-connector'
import { Chat } from './chat'

export const runtime = 'edge'
export const preferredRegion = 'home'

export default async function IndexPage() {
  return (
    <div className="h-full overflow-hidden">
      <Chat />
    </div>
  )
}
