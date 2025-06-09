/**
 * @file components/chat-input.tsx
 * @description Компонент для ввода сообщений, включая текст и файлы с авто-созданием артефактов.
 * @version 2.0.1
 * @date 2025-06-10
 * @updated Set correct message role to 'tool' when appending artifact creation results (TS2322).
 */

/** HISTORY:
 * v2.0.1 (2025-06-10): Fixed TS2322 by changing message role to 'tool' when appending artifact creation tool results.
 * v2.0.0 (2025-06-09): Переименован, добавлено авто-создание артефактов.
 * v1.7.0 (2025-06-07): Исправлена логика загрузки файлов на client-side.
 */

'use client'

import type { Attachment, UIMessage } from 'ai'
import type React from 'react'
import { type ChangeEvent, type Dispatch, type SetStateAction, useCallback, useRef, useState, } from 'react'
import Textarea from 'react-textarea-autosize'
import { upload } from '@vercel/blob/client'

import { ArrowUpIcon, PaperclipIcon } from './icons'
import { PreviewAttachment } from './preview-attachment'
import { Button } from './ui/button'
import { SuggestedActions } from './suggested-actions'
import type { UseChatHelpers } from '@ai-sdk/react'
import { ModelSelector } from './model-selector'
import type { Session } from 'next-auth'
import type { UIArtifact } from './artifact'
import { toast } from './toast'
import { generateUUID } from '@/lib/utils'

async function createArtifactFromUpload (url: string, name: string, type: string) {
  const response = await fetch('/api/artifacts/create-from-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      title: name,
      kind: type.startsWith('image/') ? 'image' : 'text'
    })
  })
  if (!response.ok) {
    throw new Error('Failed to create artifact from upload')
  }
  return response.json()
}

export function ChatInput ({
  chatId,
  input,
  setInput,
  status,
  attachments,
  setAttachments,
  messages,
  append,
  handleSubmit,
  session,
  initialChatModel,
  artifact,
}: {
  chatId: string;
  input: UseChatHelpers['input'];
  setInput: UseChatHelpers['setInput'];
  status: UseChatHelpers['status'];
  attachments: Array<Attachment>;
  setAttachments: Dispatch<SetStateAction<Array<Attachment>>>;
  messages: Array<UIMessage>;
  append: UseChatHelpers['append'];
  handleSubmit: UseChatHelpers['handleSubmit'];
  session: Session;
  initialChatModel: string;
  artifact: UIArtifact;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFiles, setUploadingFiles] = useState<Array<string>>([])

  const submitForm = useCallback(() => {
    if (status !== 'ready') {
      toast({ type: 'error', description: 'Please wait for the model to finish its response!' })
      return
    }

    const options: Parameters<typeof handleSubmit>[1] = {
      body: {
        id: chatId,
        selectedChatModel: initialChatModel,
        selectedVisibilityType: 'private',
        activeArtifactId: artifact.isVisible ? artifact.artifactId : undefined,
        activeArtifactTitle: artifact.isVisible ? artifact.title : undefined,
        activeArtifactKind: artifact.isVisible ? artifact.kind : undefined,
      }
    }

    handleSubmit(undefined, options)
    setInput('')
  }, [status, chatId, handleSubmit, setInput, initialChatModel, artifact])

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      if (!files.length) return

      setUploadingFiles(files.map(file => file.name))
      toast({ type: 'loading', description: `Uploading ${files.length} file(s)...` })

      try {
        for (const file of files) {
          const newBlob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/files/upload',
          })

          toast({ type: 'loading', description: `Creating artifact for ${file.name}...` })

          const artifactMetadata = await createArtifactFromUpload(newBlob.url, newBlob.pathname, newBlob.contentType)

          append({
            id: generateUUID(),
            role: 'tool', // Changed from 'user'
            content: '',
            parts: [{
              type: 'tool-result',
              toolCallId: generateUUID(),
              toolName: 'artifactCreate',
              result: artifactMetadata
            }]
          })
        }
        toast({ type: 'success', description: 'Artifact(s) created successfully!' })

      } catch (error) {
        console.error('SYS_UPLOAD_ERR:', error)
        toast({ type: 'error', description: 'Failed to upload files, please try again!' })
      } finally {
        setUploadingFiles([])
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [append],
  )

  return (
    <div className="relative w-full flex flex-col gap-2">
      {messages.length === 0 &&
        uploadingFiles.length === 0 && (
          <SuggestedActions
            append={append}
            chatId={chatId}
            selectedVisibilityType={'private'}
          />
        )}

      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      <div className="flex flex-col w-full p-2 bg-muted dark:bg-zinc-800 rounded-2xl border dark:border-zinc-700">
        {uploadingFiles.length > 0 && (
          <div
            data-testid="attachments-preview"
            className="flex flex-row gap-2 overflow-x-scroll items-end p-2 border-b dark:border-zinc-700"
          >
            {uploadingFiles.map((filename) => (
              <PreviewAttachment
                key={filename}
                attachment={{ url: '', name: filename, contentType: '' }}
                isUploading={true}
              />
            ))}
          </div>
        )}

        <Textarea
          data-testid="chat-input"
          placeholder="Send a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full resize-none bg-transparent !text-base border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none p-2"
          rows={2}
          maxRows={12}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.shiftKey) {
              event.preventDefault()
              submitForm()
            }
          }}
        />

        <div className="flex w-full items-center justify-between gap-2 pt-2">
          <div className="flex gap-1">
            <Button
              data-testid="attachments-button"
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={status !== 'ready' || uploadingFiles.length > 0}
            >
              <PaperclipIcon size={18}/>
            </Button>
            <ModelSelector
              session={session}
              selectedModelId={initialChatModel}
              className=""
            />
          </div>

          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">⌘+Enter to send</p>
            <Button
              data-testid="send-button"
              size="icon"
              variant="outline"
              className="rounded-full"
              onClick={(e) => {
                e.preventDefault()
                submitForm()
              }}
              disabled={input.length === 0 || uploadingFiles.length > 0 || status !== 'ready'}
            >
              <ArrowUpIcon size={18}/>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// END OF: components/chat-input.tsx
