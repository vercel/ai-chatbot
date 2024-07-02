import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Bem vindo ao LexGPT!
        </h1>
        <p className="leading-normal text-muted-foreground">
          Pesquisa de jurisprudência do STJ com tecnologia exclusiva de busca &quot;lenta&quot;. 
          Desenvolvemos com transparência para que você saiba o que está dentro deste GPT e quais 
          suas limitações. Confiamos na IA, mas verifique no site antes de citar. Acompanhe nosso 
          changelog em {' '}
          <ExternalLink href="https://news.lexgpt.com.br">
            news.lexgpt.com.br
          </ExternalLink>
          . 
        </p>
      </div>
    </div>
  )
}
