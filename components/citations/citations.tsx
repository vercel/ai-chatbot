import { CitationCard } from './citation-card'
import {
  IconBookOpenText,
  IconGlobeSimple,
  IconFilePdf,
  IconDiscourse,
  IconDiscord,
  IconStackOverflow
} from './citation-icons'
import { IconGitHub } from '../ui/icons'
import type { z } from 'zod'
import { LinksSchema } from '@/lib/inkeep-qa-schema'

const citationIcons = {
  documentation: IconBookOpenText,
  site: IconGlobeSimple,
  pdf: IconFilePdf,
  discourse_post: IconDiscourse,
  github_issue: IconGitHub,
  github_release: IconGitHub,
  github_discussion: IconGitHub,
  stackoverflow_question: IconStackOverflow,
  discord_forum_post: IconDiscord,
  discord_message: IconDiscord
}

interface CitationsProps {
  links: z.infer<typeof LinksSchema>
}

export function Citations({ links }: CitationsProps) {
  return (
    <div className="pt-8">
      <h3 className="text-sm text-muted-foreground">Sources</h3>
      <div className="mt-3 flex flex-col gap-3">
        {links?.map(link => {
          if (!link) {
            return null
          }
          const type = (link.type || 'site') as keyof typeof citationIcons
          return (
            <CitationCard
              key={link.url}
              title={link.title}
              url={link.url}
              Icon={citationIcons[type] || IconBookOpenText}
              breadcrumbs={(link.breadcrumbs as string[]) || []}
            />
          )
        })}
      </div>
    </div>
  )
}
