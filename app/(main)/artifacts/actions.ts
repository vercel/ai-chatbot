/**
 * @file app/(main)/artifacts/actions.ts
 * @description Server Actions для управления артефактами.
 * @version 2.0.0
 * @date 2025-06-09
 * @updated Функции переименованы для работы с "Artifact", используется мягкое удаление.
 */

/** HISTORY:
 * v2.0.0 (2025-06-09): Переход на Artifact и мягкое удаление.
 * v1.0.1 (2025-06-06): Исправлен доступ к свойству `userId`.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/app/(auth)/auth'
import { deleteArtifactSoftById, getArtifactById } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'

interface ActionResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export async function deleteArtifact (artifactId: string): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Пользователь не авторизован.', errorCode: 'unauthorized:artifact' }
  }

  try {
    const artifactResult = await getArtifactById({ id: artifactId })
    if (!artifactResult || !artifactResult.doc || artifactResult.doc.userId !== session.user.id) {
      return { success: false, error: 'Артефакт не найден или доступ запрещен.', errorCode: 'forbidden:artifact' }
    }

    await deleteArtifactSoftById({ artifactId, userId: session.user.id })

    revalidatePath('/artifacts') // Обновляем путь
    return { success: true }
  } catch (error) {
    if (error instanceof ChatSDKError) {
      return { success: false, error: error.message, errorCode: `${error.type}:${error.surface}` }
    }
    return { success: false, error: 'Не удалось удалить артефакт.', errorCode: 'bad_request:artifact' }
  }
}

// END OF: app/(main)/artifacts/actions.ts
