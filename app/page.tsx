import { Chat } from '@/components/chat'
import { Header } from '@/components/header'

// export const runtime = 'edge'
export const preferredRegion = 'home'

export default async function IndexPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* @ts-ignore */}
      <Header />
      <main className="flex-1 bg-muted/50">
        <Chat />
      </main>
    </div>
  )
}
