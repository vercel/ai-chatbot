import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg bg-white p-8">
        <h1 className="text-lg font-semibold">
          Hi, I'm your Calm Companion!
        </h1>
        <p className="leading-normal text-muted-foreground">
          {`How can I help you today? You can tell me about your day, share your feelings, or ask me anything. I'm here to listen and support you.`}
        </p>
      </div>
    </div>
  )
}
