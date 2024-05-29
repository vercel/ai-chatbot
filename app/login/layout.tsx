import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { cn } from '@/lib/utils'
import '@/app/globals.css'

interface LoginLayoutProps {
  children: React.ReactNode
}

export default function LoginLayout({ children }: LoginLayoutProps) {
  return (
    <main
      className={`flex flex-col flex-1 bg-muted/50 ${cn(
        'font-sans antialiased',
        GeistSans.variable,
        GeistMono.variable
      )}}`}
    >
      {children}
    </main>
  )
}
