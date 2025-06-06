/**
 * @file components/chat.tsx
 * @description Основной компонент чата.
 * @version 1.4.1
 * @date 2025-06-06
 * @updated Импорт `toast` заменен на локальную обертку для консистентности.
 */

/** HISTORY:
 * v1.4.1 (2025-06-06): Заменен импорт `toast` на локальную обертку.
 * v1.4.0 (2025-06-06): Добавлена обработка `discussArtifactId` и `toast.dismiss()`.
 * v1.3.2 (2025-06-06): Устранен дублирующийся импорт и исправлены классы Tailwind.
 * v1.3.1 (2025-06-06): Удален неиспользуемый проп initialVisibilityType и исправлена логика onFinish.
 * v1.3.0 (2025-06-05): Перестроен макет на flex, удален ChatHeader.
 * v1.2.1 (2025-06-05): Исправлен импорт useSWRConfig.
 */

'use client'

import type { Attachment, UIMessage } from 'ai'
import { useChat } from '@ai-sdk/react'
import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import type { Vote } from '@/lib/db/schema'
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils'
import { MultimodalInput } from './multimodal-input'
import { Messages } from './messages'
import { useArtifact, useArtifactSelector } from '@/hooks/use-artifact'
import { unstable_serialize } from 'swr/infinite'
import { getChatHistoryPaginationKey } from './sidebar-history'
import { toast } from './toast'
import type { Session } from 'next-auth'
import { useSearchParams } from 'next/navigation'
import { useAutoResume } from '@/hooks/use-auto-resume'
import { ChatSDKError } from '@/lib/errors'
import type { VisibilityType } from '@/lib/types'

export function Chat ({
  id,
  initialMessages,
  initialChatModel,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { mutate } = useSWRConfig()
  const initialVisibilityType: VisibilityType = 'private'

  useEffect(() => {
    toast.dismiss() // Скрываем все предыдущие уведомления при загрузке чата.

    mutate('active-chat-context', {
      chatId: id,
      visibility: initialVisibilityType,
    })

    return () => {
      mutate('active-chat-context', null)
    }
  }, [id, initialVisibilityType, mutate])

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: (body) => ({
      id,
      message: body.messages.at(-1),
      selectedChatModel: initialChatModel,
      selectedVisibilityType: initialVisibilityType,
    }),
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey))
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        })
      }
    },
  })

  const searchParams = useSearchParams()
  const query = searchParams.get('query')
  const discussArtifactId = searchParams.get('discussArtifact')

  const { setArtifact } = useArtifact()

  useEffect(() => {
    if (discussArtifactId) {
      append({
        role: 'user',
        content: `Давай обсудим этот документ: /notes?openDocId=${discussArtifactId}`,
      })
      setArtifact((prev) => ({ ...prev, documentId: discussArtifactId, isVisible: true, displayMode: 'split' }))
      window.history.replaceState({}, '', `/chat/${id}`)
    }
  }, [discussArtifactId, id, append, setArtifact])

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false)

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      })

      setHasAppendedQuery(true)
      window.history.replaceState({}, '', `/chat/${id}`)
    }
  }, [query, append, hasAppendedQuery, id])

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  )

  const [attachments, setAttachments] = useState<Array<Attachment>>([])
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible)

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  })

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="grow overflow-y-auto">
        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 pb-4">
        {!isReadonly && (
          <MultimodalInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
            status={status}
            attachments={attachments}
            setAttachments={setAttachments}
            messages={messages}
            append={append}
            session={session}
            initialChatModel={initialChatModel}
          />
        )}
      </div>
    </div>
  )
}

// END OF: components/chat.tsx
