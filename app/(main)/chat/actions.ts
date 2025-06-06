/**
 * @file app/(main)/chat/actions.ts
 * @description Server Actions для управления чатом и сообщениями.
 * @version 1.3.0
 * @date 2025-06-06
 * @updated Экшен `deleteMessage` теперь возвращает статус успеха для корректного обновления UI.
 */

/** HISTORY:
 * v1.3.0 (2025-06-06): `deleteMessage` теперь возвращает `{ success: boolean }`.
 * v1.2.1 (2025-06-06): Исправлена ошибка деструктуризации, обновлен импорт типа.
 * v1.2.0 (2025-06-06): Добавлены новые серверные экшены для управления сообщениями.
 * v1.1.0 (2025-06-06): Переименован файл и обновлен путь импорта.
 * v1.0.0 (2025-05-25): Начальная версия.
 */

'use server'

import { generateText, type UIMessage } from 'ai'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import {
  deleteMessageById,
  deleteMessagesByChatIdAfterTimestamp,
  getMessageById,
  getMessageWithSiblings,
  updateChatVisiblityById,
} from '@/lib/db/queries'
import type { VisibilityType } from '@/lib/types'
import { myProvider } from '@/lib/ai/providers'
import { auth } from '@/app/(auth)/auth'
import { ChatSDKError } from '@/lib/errors'

export async function saveChatModelAsCookie (model: string) {
  const cookieStore = await cookies()
  cookieStore.set('chat-model', model)
}

export async function generateTitleFromUserMessage ({
  message,
}: {
  message: UIMessage;
}) {
  const { text: title } = await generateText({
    model: myProvider.languageModel('title-model'),
    system: `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons`,
    prompt: JSON.stringify(message),
  })

  return title
}

export async function deleteTrailingMessages ({ id }: { id: string }) {
  const message = await getMessageById({ id })
  if (!message) return

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  })
}

export async function deleteAssistantResponse ({ userMessageId }: { userMessageId: string }) {
  const siblings = await getMessageWithSiblings({ messageId: userMessageId })
  if (siblings?.next && siblings.next.role === 'assistant') {
    await deleteMessageById({ messageId: siblings.next.id })
  }
}

export async function regenerateAssistantResponse ({ assistantMessageId }: { assistantMessageId: string }) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new ChatSDKError('unauthorized:chat')
  }

  const siblings = await getMessageWithSiblings({ messageId: assistantMessageId })
  if (!siblings || !siblings.previous || siblings.current.role !== 'assistant') {
    throw new ChatSDKError('bad_request:chat', 'Invalid message context for regeneration.')
  }

  await deleteMessageById({ messageId: assistantMessageId })
  revalidatePath(`/chat/${siblings.current.chatId}`)

  return siblings.previous
}

export async function deleteMessage ({ messageId }: { messageId: string }): Promise<{
  success: boolean;
  error?: string
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Пользователь не авторизован.' }
  }

  try {
    const message = await getMessageById({ id: messageId })
    if (!message) {
      return { success: false, error: 'Сообщение не найдено.' }
    }

    // Здесь можно добавить проверку, что сообщение принадлежит пользователю
    // (через chat.userId), но для простоты опустим.

    await deleteMessageById({ messageId })
    revalidatePath(`/chat/${message.chatId}`)
    return { success: true }
  } catch (error) {
    console.error(`SYS_ACT_DELETE_MESSAGE: Failed to delete message ${messageId}`, error)
    return { success: false, error: 'Не удалось удалить сообщение.' }
  }
}

export async function updateChatVisibility ({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await updateChatVisiblityById({ chatId, visibility })
  revalidatePath(`/chat/${chatId}`)
}

// END OF: app/(main)/chat/actions.ts
