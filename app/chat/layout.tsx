import '@/app/globals.css'
import { Chat } from '@/components/chat'

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <Chat />
  )
}