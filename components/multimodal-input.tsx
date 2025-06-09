/**
 * @file components/multimodal-input.tsx
 * @description Компонент для ввода мультимодальных сообщений, включая текст и вложения.
 * @version 1.7.0
 * @date 2025-06-07
 * @updated Исправлена логика загрузки файлов на client-side в соответствии с API @vercel/blob/client.
 */

/** HISTORY:
 * v1.7.0 (2025-06-07): Заменен ручной fetch на `upload` из `@vercel/blob/client` для корректной загрузки.
 * v1.6.0 (2025-06-07): Переход на client-side upload для Vercel Blob.
 * v1.5.1 (2025-06-06): Исправлены ошибки типизации для `options.body`.
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

function PureMultimodalInput ({
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
  artifact: UIArtifact; // Принимаем artifact как проп
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFiles, setUploadingFiles] = useState<Array<string>>([])

  const submitForm = useCallback(() => {
    if (status !== 'ready') {
      toast({ type: 'error', description: 'Please wait for the model to finish its response!' })
      return
    }

    const options: Parameters<typeof handleSubmit>[1] = {
      experimental_attachments: attachments,
      body: {
        id: chatId,
        selectedChatModel: initialChatModel,
        selectedVisibilityType: 'private',
      }
    }

    if (artifact.isVisible && artifact.documentId !== 'init') {
      if (!options.body) {
        options.body = {}
      }
      // @ts-ignore
      options.body.activeArtifactId = artifact.documentId
      // @ts-ignore
      options.body.activeArtifactTitle = artifact.title
      // @ts-ignore
      options.body.activeArtifactKind = artifact.kind
    }

    handleSubmit(undefined, options)

    setAttachments([])
    setInput('')
  }, [status, chatId, handleSubmit, attachments, setAttachments, setInput, initialChatModel, artifact])

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])
      if (!files.length) return

      setUploadingFiles(files.map(file => file.name))

      try {
        const uploadPromises = files.map(async (file) => {
          const newBlob = await upload(file.name, file, {
            access: 'public',
            handleUploadUrl: '/api/files/upload',
          })

          return { url: newBlob.url, name: newBlob.pathname, contentType: newBlob.contentType }
        })

        const uploadedAttachments = await Promise.all(uploadPromises)

        setAttachments((current) => [...current, ...uploadedAttachments])

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
    [setAttachments],
  )

  return (
    <div className="relative w-full flex flex-col gap-2">
      {messages.length === 0 &&
        attachments.length === 0 &&
        uploadingFiles.length === 0 && (
          <SuggestedActions
            append={append}
            chatId={chatId}
            // @ts-ignore
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
        {(attachments.length > 0 || uploadingFiles.length > 0) && (
          <div
            data-testid="attachments-preview"
            className="flex flex-row gap-2 overflow-x-scroll items-end p-2 border-b dark:border-zinc-700"
          >
            {attachments.map((attachment, idx) => (
              <PreviewAttachment
                key={attachment.url}
                attachment={attachment}
                onRemove={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
              />
            ))}
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
          data-testid="multimodal-input"
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

export const MultimodalInput = PureMultimodalInput
// END OF: components/multimodal-input.tsx
