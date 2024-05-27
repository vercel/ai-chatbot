import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto w-full px-4">
      <div className="flex flex-col gap-2 bg-transparent p-8">
        <h1 className="text-lg font-semibold">
          Welcome to Huddlechat! 🏈
        </h1>
        <p className="leading-normal text-muted-foreground">
         Huddlechat is an AI-powered chatbot to help you with analyzing NFL data.
        </p>
        <p className="leading-normal text-muted-foreground">
          I use{' '}
          <ExternalLink href="https://vercel.com/blog/ai-sdk-3-generative-ui">
            nflfastR
          </ExternalLink>{' '}
          as a database to provide you with the latest NFL data.
        </p>
      </div>
    </div>
  )
}
