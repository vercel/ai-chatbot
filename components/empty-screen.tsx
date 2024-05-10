import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">Welcome to Dog Whisperer AI!</h1>
        <p className="leading-normal text-muted-foreground">
          Meet Zoe, your AI dog training assistant designed to help you train
          your dog with a modern, force-free approach.
        </p>
        <p className="leading-normal text-muted-foreground">
          To get started, pick one of our trending questions below or ask Zoe a
          question! Happy training!
        </p>
      </div>
    </div>
  )
}
