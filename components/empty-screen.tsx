import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
      <h1 className="text-lg font-semibold">
  Welcome to the Maliyadeva AI Chatbot!
</h1>
<p className="leading-normal text-muted-foreground">
  This AI Chatbot is powered by <ExternalLink href="https://gucios.com">Gucios AI</ExternalLink>.
</p>
<p className="leading-normal text-muted-foreground">
  Built by fine-tuning the <ExternalLink href="https://gucios.com/ai-model">Gucios AI Language Model</ExternalLink>, this chatbot is designed to answer questions about Maliyadeva College. 
</p>
<p className="leading-normal text-muted-foreground">
  This model is currently in BETA. If you encounter any issues, contact us.
</p>

      </div>
    </div>
  )
}
