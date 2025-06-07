/**
 * @file app/(main)/content/actions.ts
 * @description Server Actions для управления контентом (артефактами).
 * @version 1.0.1
 * @date 2025-06-06
 * @updated Исправлена ошибка доступа к свойству 'userId' после изменения структуры getDocumentById.
 */

/** HISTORY:
 * v1.0.1 (2025-06-06): Исправлен доступ к свойству `userId`.
 * v1.0.0 (2025-06-06): Созданы Server Actions для управления контентом.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/app/(auth)/auth'
import { deleteDocumentCompletelyById, getDocumentById } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'

interface DeleteContentResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export async function deleteContent (documentId: string): Promise<DeleteContentResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Пользователь не авторизован.', errorCode: 'unauthorized:document' }
  }

  try {
    const docResult = await getDocumentById({ id: documentId })
    if (!docResult || !docResult.doc || docResult.doc.userId !== session.user.id) {
      return { success: false, error: 'Контент не найден или доступ запрещен.', errorCode: 'forbidden:document' }
    }

    await deleteDocumentCompletelyById({ documentId, userId: session.user.id })

    revalidatePath('/content')
    return { success: true }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return { success: false, error: error.message, errorCode: `${error.type}:${error.surface}` }
    }
    return { success: false, error: 'Не удалось удалить контент.', errorCode: 'bad_request:document' }
  }
}

// END OF: app/(main)/content/actions.ts
