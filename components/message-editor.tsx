/**
 * @file components/message-editor.tsx
 * @description Компонент для редактирования сообщения пользователя.
 * @version 1.1.1
 * @date 2025-06-06
 * @updated Исправлена зависимость в useEffect для корректной установки курсора.
 */

/** HISTORY:
 * v1.1.1 (2025-06-06): Исправлена зависимость в useEffect для корректной установки курсора.
 * v1.1.0 (2025-06-06): Исправлена инициализация состояния, логика сохранения заменена на deleteAssistantResponse.
 * v1.0.0 (2025-06-06): Начальная версия.
 */

'use client'

import type { Message } from 'ai'
import { Button } from './ui/button'
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from 'react'
import { Textarea } from './ui/textarea'
import { deleteAssistantResponse } from '@/app/(main)/chat/actions'
import type { UseChatHelpers } from '@ai-sdk/react'
import { toast } from './toast'

export type MessageEditorProps = {
  message: Message;
  setMode: Dispatch<SetStateAction<'view' | 'edit'>>;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
};

export function MessageEditor ({
  message,
  setMode,
  setMessages,
  reload,
}: MessageEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [draftContent, setDraftContent] = useState<string>(message.content)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Устанавливаем фокус и перемещаем курсор в конец текста при открытии редактора
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(draftContent.length, draftContent.length)
      adjustHeight()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftContent.length])

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 2}px`
    }
  }

  const handleInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftContent(event.target.value)
    adjustHeight()
  }

  const handleSave = async () => {
    setIsSubmitting(true)
    try {
      // Обновляем сообщение на клиенте для мгновенного отклика
      setMessages((messages) =>
        messages.map((m) =>
          m.id === message.id
            ? { ...m, content: draftContent, parts: [{ type: 'text', text: draftContent }] }
            : m,
        ),
      )
      // Удаляем только следующий ответ ассистента
      await deleteAssistantResponse({ userMessageId: message.id })

      // Перегенерируем ответ
      reload()
      setMode('view')
    } catch (error) {
      toast({ type: 'error', description: 'Не удалось сохранить изменения.' })
      console.error('Failed to save edited message:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <Textarea
        data-testid="message-editor"
        ref={textareaRef}
        className="bg-transparent outline-none overflow-hidden resize-none !text-base rounded-xl w-full"
        value={draftContent}
        onChange={handleInput}
      />

      <div className="flex flex-row gap-2 justify-end">
        <Button
          variant="outline"
          className="h-fit py-2 px-3"
          onClick={() => {
            setMode('view')
          }}
        >
          Отмена
        </Button>
        <Button
          data-testid="message-editor-send-button"
          variant="default"
          className="h-fit py-2 px-3"
          disabled={isSubmitting || draftContent === message.content}
          onClick={handleSave}
        >
          {isSubmitting ? 'Сохранение...' : 'Сохранить и отправить'}
        </Button>
      </div>
    </div>
  )
}

// END OF: components/message-editor.tsx
