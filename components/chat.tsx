/**
 * @file components/chat.tsx
 * @description Основной компонент чата.
 * @version 2.0.1
 * @date 2025-06-10
 * @updated Removed obsolete 'votes' prop from Messages component invocation (TS2322).
 */

/** HISTORY:
 * v2.0.1 (2025-06-10): Fixed TS2322 by removing the unsupported 'votes' prop from the Messages component.
 * v2.0.0 (2025-06-09): Рефакторинг. Удалена обработка `data` и `DataStreamHandler`.
 * v1.9.3 (2025-06-09): Добавлена обработка события `artifact-created`.
 */

'use client'

import type { Attachment, UIMessage } from 'ai'
import { useChat } from '@ai-sdk/react'
import { useEffect, useState } from 'react'
import { useSWRConfig } from 'swr'
import { fetchWithErrorHandlers, generateUUID } from '@/lib/utils'
import { ChatInput } from './chat-input'
import { Messages } from './messages'
import { useArtifactSelector } from '@/hooks/use-artifact'
import { unstable_serialize } from 'swr/infinite'
import { getChatHistoryPaginationKey } from './sidebar-history'
import { toast } from './toast'
import type { Session } from 'next-auth'
import { useSearchParams } from 'next/navigation'
import { useAutoResume } from '@/hooks/use-auto-resume'
import { ChatSDKError } from '@/lib/errors'
import type { VisibilityType } from '@/lib/types'
import { getAndClearArtifactFromClipboard } from '@/app/app/(main)/artifacts/actions'

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
  const artifact = useArtifactSelector(state => state)
  const initialVisibilityType: VisibilityType = 'private'

  useEffect(() => {
    toast.dismiss()
    mutate('active-chat-context', { chatId: id, visibility: initialVisibilityType })
    return () => { mutate('active-chat-context', null) }
  }, [id, initialVisibilityType, mutate])

  const {
    data,
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
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey))
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({ type: 'error', description: error.message })
      }
    },
  })

  const searchParams = useSearchParams()
  const query = searchParams.get('query')
  const [hasAppendedQuery, setHasAppendedQuery] = useState(false)

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({ role: 'user', content: query })
      setHasAppendedQuery(true)
      window.history.replaceState({}, '', `/chat/${id}`)
    }
  }, [query, append, hasAppendedQuery, id])

  const [attachments, setAttachments] = useState<Array<Attachment>>([])
  const [clipboardArtifact, setClipboardArtifact] = useState<{
    artifactId: string
    title: string
    kind: string
  } | null>(null)
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible)

  useEffect(() => {
    getAndClearArtifactFromClipboard().then((data) => {
      if (data) setClipboardArtifact(data)
    }).catch(() => {})
  }, [])

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
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 pb-4">
        {!isReadonly && (
          <ChatInput
            chatId={id}
            input={input}
            setInput={setInput}
            handleSubmit={handleSubmit}
          status={status}
          attachments={attachments}
          setAttachments={setAttachments}
          clipboardArtifact={clipboardArtifact}
          setClipboardArtifact={setClipboardArtifact}
          messages={messages}
          append={append}
          session={session}
            initialChatModel={initialChatModel}
            artifact={artifact}
          />
        )}
      </div>
    </div>
  )
}

// END OF: components/chat.tsx
