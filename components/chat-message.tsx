import { Message } from 'ai-connector'
import { User } from 'lucide-react'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

import { cn } from '@/lib/utils'
import { fontMessage } from '@/lib/fonts'
import CodeBlock from '@/components/ui/codeblock'
import { MemoizedReactMarkdown } from '@/components/markdown'
import { OpenAI } from '@/components/icons'

export interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message, ...props }: ChatMessageProps) {
  return (
    <div
      className={cn(
        'flex items-start space-x-4 mb-4 relative -ml-12',
        fontMessage.className,
        message.role === 'user' && 'mt-12 first:mt-0'
      )}
      {...props}
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full select-none border',
          message.role === 'assistant' && 'bg-primary text-primary-foreground'
        )}
      >
        {message.role === 'user' ? (
          <User className="w-4 h-4" />
        ) : (
          <OpenAI className="w-4 h-4" />
        )}
      </div>
      <div
        className={cn(
          'border rounded-lg py-2 px-4',
          message.role === 'assistant' && 'bg-muted/30'
        )}
      >
        <MemoizedReactMarkdown
          className="prose dark:prose-invert prose-sm prose-pre:rounded-md w-full flex-1 leading-6 prose-p:leading-[1.8rem] prose-pre:bg-[#282c34] max-w-full"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return (
                <p
                  className={cn(
                    'mb-2 last:mb-0',
                    message.role === 'user' && 'font-medium'
                  )}
                >
                  {children}
                </p>
              )
            },
            code({ node, inline, className, children, ...props }) {
              if (children.length) {
                if (children[0] == '▍') {
                  return (
                    <span className="mt-1 animate-pulse cursor-default">▍</span>
                  )
                }

                children[0] = (children[0] as string).replace('`▍`', '▍')
              }

              const match = /language-(\w+)/.exec(className || '')

              return !inline ? (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ''}
                  value={String(children).replace(/\n$/, '')}
                  {...props}
                />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            },
            table({ children }) {
              return (
                <table className="border-collapse border border-black px-3 py-1 ">
                  {children}
                </table>
              )
            },
            th({ children }) {
              return (
                <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white ">
                  {children}
                </th>
              )
            },
            td({ children }) {
              return (
                <td className="break-words border border-black px-3 py-1">
                  {children}
                </td>
              )
            }
          }}
        >
          {message.content}
        </MemoizedReactMarkdown>
      </div>
    </div>
  )
}
