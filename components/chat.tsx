/**
 * @file components/chat.tsx
 * @description Основной компонент чата.
 * @version 1.9.3
 * @date 2025-06-09
 * @updated Добавлена обработка нового события `artifact-created` для отображения артефакта.
 */

/** HISTORY:
 * v1.9.3 (2025-06-09): Добавлена обработка события `artifact-created`.
 * v1.9.2 (2025-06-09): Добавлена десериализация JSON для `user-message-update`.
 * v1.9.1 (2025-06-07): Добавлена обработка события `user-message-update` из DataStream.
 * v1.9.0 (2025-06-06): Удалена логика и пропсы, связанные с голосованием.
 */

'use client'

import type { Attachment, UIMessage } from 'ai'
import { useChat } from '@ai-sdk/react'
import { useEffect, useState } from 'react'
import { useSWRConfig } from 'swr'
import { fetchWithErrorHandlers, generateUUID } from '@/lib/utils'
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
  const { artifact, setArtifact } = useArtifact()
  const initialVisibilityType: VisibilityType = 'private'

  useEffect(() => {
    toast.dismiss()

    mutate('active-chat-context', {
      chatId: id,
      visibility: initialVisibilityType,
    })

    return () => {
      mutate('active-chat-context', null)
    }
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
        toast({
          type: 'error',
          description: error.message,
        })
      }
    },
  })

  // Обработка кастомных событий из DataStream
  useEffect(() => {
    if (!data) return;
    const lastData = data[data.length-1] as any;

    if(lastData?.type === 'user-message-update' && lastData.data) {
        try {
            const updatedMessage = JSON.parse(lastData.data);
            setMessages(currentMessages =>
                currentMessages.map(msg =>
                    msg.id === updatedMessage.id ? updatedMessage : msg
                )
            )
        } catch (e) {
            console.error("Failed to parse user-message-update data", e);
        }
    } else if (lastData?.type === 'artifact-created' && lastData.data) {
        try {
            const artifactData = JSON.parse(lastData.data);
            setArtifact({
                documentId: artifactData.id,
                kind: artifactData.kind,
                title: artifactData.title,
                content: artifactData.content ?? '',
                status: 'idle',
                saveStatus: 'saved',
                isVisible: true,
                displayMode: 'split',
                boundingBox: { top: 0, left: 0, width: 0, height: 0 },
            });
        } catch(e) {
            console.error("Failed to parse artifact-created data", e);
        }
    }
  }, [data, setMessages, setArtifact]);


  const searchParams = useSearchParams()
  const query = searchParams.get('query')
  const discussArtifactId = searchParams.get('discussArtifact')

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
          votes={undefined} // Votes are removed
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
            artifact={artifact}
          />
        )}
      </div>
    </div>
  )
}

// END OF: components/chat.tsx
