import * as React from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { IconGitHub, IconVercel } from '@/components/ui/icons'
import { PixelatedVercelLogo } from './pixelated-icon'

export function Header() {
  return (
    <header className="sticky top-6 z-50 flex items-center justify-between w-full h-16 px-9">
      <PixelatedVercelLogo />
      <div className="flex items-center justify-end space-x-4">
        <a
          target="_blank"
          // TODO: UPDATE
          href="https://github.com/vercel/nextjs-ai-chatbot/"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'rounded-full px-2'
          )}
        >
          <span className="hidden md:flex">GitHub</span>
          <IconGitHub className="ml-2" />
        </a>
        <a
          // TODO: UPDATE
          href="https://vercel.com/templates/Next.js/nextjs-ai-chatbot"
          target="_blank"
          className={cn(buttonVariants(), 'rounded-full px-2')}
        >
          <span className="mr-2 hidden sm:block">Deploy to Vercel</span>
          <span className="sm:hidden">Deploy</span>
          <IconVercel />
        </a>
      </div>
    </header>
  )
}
