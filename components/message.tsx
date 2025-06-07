/**
 * @file components/message.tsx
 * @description Компонент для отображения одного сообщения в чате.
 * @version 1.8.0
 * @date 2025-06-07
 * @updated Результат вызова инструмента `getDocument` больше не рендерится, чтобы избежать показа JSON в чате.
 */

/** HISTORY:
 * v1.8.0 (2025-06-07): Исключен рендеринг для `tool-result` от `getDocument`.
 * v1.7.0 (2025-06-06): Добавлена логика для скрытия raw-результатов инструментов (`tool-result`), если для них нет специального UI.
 * v1.6.0 (2025-06-06): Исправлена циклическая зависимость.
 * v1.5.0 (2025-06-06): Восстановлены действия для сообщений ассистента.
 * v1.4.0 (2025-06-06): Удалена логика голосования.
 */

'use client'

import type { UIMessage } from 'ai'
import cx from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import { memo, useState } from 'react'
import { DocumentToolCall, DocumentToolResult } from './document'
import { CopyIcon, PencilEditIcon, SparklesIcon, TrashIcon, RedoIcon } from './icons'
import { Markdown } from './markdown'
import { PreviewAttachment } from './preview-attachment'
import { Weather } from './weather'
import equal from 'fast-deep-equal'
import { cn, sanitizeText } from '@/lib/utils'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { MessageEditor } from './message-editor'
import { DocumentPreview } from './document-preview'
import { MessageReasoning } from './message-reasoning'
import type { UseChatHelpers } from '@ai-sdk/react'
import { useCopyToClipboard } from 'usehooks-ts'
import { toast } from './toast'
import { deleteMessage, regenerateAssistantResponse } from '@/app/(main)/chat/actions'

const PurePreviewMessage = ({
  chatId,
  message,
  isLoading,
  setMessages,
  reload,
  isReadonly,
  requiresScrollPadding,
}: {
  chatId: string;
  message: UIMessage;
  vote: undefined;
  isLoading: boolean;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  requiresScrollPadding: boolean;
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [, copyToClipboard] = useCopyToClipboard()

  const handleCopy = () => {
    const textContent = message.parts
      .filter(part => part.type === 'text')
      // @ts-ignore
      .map(part => part.text)
      .join('\n')

    if (!textContent) {
        toast({type: 'error', description: 'Нечего копировать.'})
        return;
    }

    copyToClipboard(textContent)
    toast({ type: 'success', description: 'Сообщение скопировано.' })
  }

  const handleDelete = async () => {
    const result = await deleteMessage({ messageId: message.id })
    if (result.success) {
      setMessages((messages) => messages.filter((m) => m.id !== message.id))
      toast({ type: 'success', description: 'Сообщение удалено.' })
    } else {
      toast({ type: 'error', description: result.error || 'Не удалось удалить сообщение.' })
    }
  }

  const handleRegenerate = async () => {
    toast({ type: 'loading', description: 'Перегенерация ответа...' });
    try {
      // Оптимистичное удаление ответа
      setMessages((messages) => messages.filter((m) => m.id !== message.id))
      await regenerateAssistantResponse({ assistantMessageId: message.id })
      reload()
    } catch (error) {
      toast({ type: 'error', description: 'Не удалось перегенерировать ответ.' })
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        data-testid={`message-${message.role}`}
        className="w-full mx-auto max-w-3xl px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        data-role={message.role}
      >
        <div
          className={cn(
            'flex gap-4 w-full group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl',
            {
              'w-full': mode === 'edit',
              'group-data-[role=user]/message:w-fit': mode !== 'edit',
            },
          )}
        >
          {message.role === 'assistant' && (
            <div
              className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border bg-background">
              <div className="translate-y-px">
                <SparklesIcon size={14}/>
              </div>
            </div>
          )}

          <div
            className={cn('flex flex-col gap-4 w-full', {
              'min-h-96': message.role === 'assistant' && requiresScrollPadding,
            })}
          >
            {message.experimental_attachments &&
              message.experimental_attachments.length > 0 && (
                <div
                  data-testid={`message-attachments`}
                  className="flex flex-row justify-end gap-2"
                >
                  {message.experimental_attachments.map((attachment) => (
                    <PreviewAttachment
                      key={attachment.url}
                      attachment={attachment}
                    />
                  ))}
                </div>
              )}

            {message.parts?.map((part, index) => {
              const { type } = part
              const key = `message-${message.id}-part-${index}`

              if (type === 'reasoning') {
                return (
                  <MessageReasoning
                    key={key}
                    isLoading={isLoading}
                    reasoning={part.reasoning}
                  />
                )
              }

              if (type === 'text') {
                if (mode === 'view') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <div className="grow">
                        <div
                          data-testid="message-content"
                          className={cn('flex flex-col gap-4', {
                            'bg-primary text-primary-foreground px-3 py-2 rounded-xl':
                              message.role === 'user',
                          })}
                        >
                          <Markdown>{sanitizeText(part.text)}</Markdown>
                        </div>
                      </div>
                      {!isReadonly && (
                        <div
                          className="shrink-0 flex items-center opacity-0 group-hover/message:opacity-100 transition-opacity">
                            {message.role === 'user' ? (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-7" onClick={handleCopy}><CopyIcon size={14}/></Button></TooltipTrigger>
                                        <TooltipContent>Скопировать</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-7" onClick={() => setMode('edit')}><PencilEditIcon size={14}/></Button></TooltipTrigger>
                                        <TooltipContent>Редактировать</TooltipContent>
                                    </Tooltip>
                                </>
                            ) : (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-7" onClick={handleCopy}><CopyIcon size={14}/></Button></TooltipTrigger>
                                        <TooltipContent>Скопировать</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild><Button variant="ghost" size="icon" className="size-7" onClick={handleRegenerate}><RedoIcon size={14}/></Button></TooltipTrigger>
                                        <TooltipContent>Перегенерировать</TooltipContent>
                                    </Tooltip>
                                </>
                            )}
                          <Tooltip>
                            <TooltipTrigger asChild><Button variant="ghost" size="icon"
                                                            className="size-7 text-destructive"
                                                            onClick={handleDelete}><TrashIcon
                              size={14}/></Button></TooltipTrigger>
                            <TooltipContent>Удалить</TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  )
                }

                if (mode === 'edit') {
                  return (
                    <div key={key} className="flex flex-row gap-2 items-start">
                      <MessageEditor
                        key={message.id}
                        message={message}
                        setMode={setMode}
                        setMessages={setMessages}
                        reload={reload}
                      />
                    </div>
                  )
                }
              }

              if (type === 'tool-invocation') {
                const { toolInvocation } = part
                const { toolName, toolCallId, state } = toolInvocation

                if (state === 'call') {
                  const { args } = toolInvocation

                  return (
                    <div
                      key={toolCallId}
                      className={cx({
                        skeleton: ['getWeather'].includes(toolName),
                      })}
                    >
                      {toolName === 'getWeather' ? (
                        <Weather/>
                      ) : toolName === 'createDocument' ? (
                        <DocumentPreview isReadonly={isReadonly} args={args}/>
                      ) : toolName === 'updateDocument' ? (
                        <DocumentToolCall
                          type="update"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : toolName === 'requestSuggestions' ? (
                        <DocumentToolCall
                          type="request-suggestions"
                          args={args}
                          isReadonly={isReadonly}
                        />
                      ) : null}
                    </div>
                  )
                }

                if (state === 'result') {
                  const { result } = toolInvocation

                  // Отображаем только те результаты инструментов, для которых есть специальный UI
                  switch (toolName) {
                    case 'getWeather':
                      return <Weather key={toolCallId} weatherAtLocation={result}/>
                    case 'createDocument':
                    case 'updateDocument':
                    case 'requestSuggestions':
                       return <DocumentPreview key={toolCallId} isReadonly={isReadonly} result={result}/>
                    // Все остальные результаты инструментов, особенно getDocument, просто игнорируются
                    case 'getDocument':
                    default:
                      return null
                  }
                }
              }

              return null
            })}

          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.isLoading !== nextProps.isLoading) return false
    if (prevProps.message.id !== nextProps.message.id) return false
    if (prevProps.requiresScrollPadding !== nextProps.requiresScrollPadding)
      return false
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false

    // Vote is removed
    // if (!equal(prevProps.vote, nextProps.vote)) return false

    return true
  },
)

export const ThinkingMessage = () => {
  const role = 'assistant'

  return (
    <motion.div
      data-testid="message-assistant-loading"
      className="w-full mx-auto max-w-3xl px-4 group/message min-h-96"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 1 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          {
            'group-data-[role=user]/message:bg-muted': true,
          },
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14}/>
        </div>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-4 text-muted-foreground">
            Hmm...
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// END OF: components/message.tsx