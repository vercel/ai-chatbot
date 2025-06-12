/**
 * @file app/(main)/artifacts/actions.ts
 * @description Server Actions для управления артефактами.
 * @version 2.1.0
 * @date 2025-06-12
 * @updated Added Redis clipboard actions.
 */

/** HISTORY:
 * v2.1.0 (2025-06-12): Added clipboard actions using Redis.
 * v2.0.0 (2025-06-09): Переход на Artifact и мягкое удаление.
 * v1.0.1 (2025-06-06): Исправлен доступ к свойству `userId`.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/app/app/(auth)/auth'
import { deleteArtifactSoftById, getArtifactById } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import { withRedis } from '@/lib/redis'
import type { ArtifactKind } from '@/lib/types'

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

export async function copyArtifactToClipboard ({
  artifactId,
  title,
  kind,
}: {
  artifactId: string
  title: string
  kind: ArtifactKind
}): Promise<ActionResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: 'Пользователь не авторизован.', errorCode: 'unauthorized:clipboard' }
  }

  try {
    await withRedis(async (client) => {
      await client.set(`user-clipboard:${session.user.id}`, JSON.stringify({ artifactId, title, kind }), { EX: 60 })
    })
    return { success: true }
  } catch (error) {
    console.error('REDIS_CLIPBOARD_SET_ERROR', error)
    return { success: false, error: 'Не удалось сохранить артефакт.', errorCode: 'bad_request:clipboard' }
  }
}

export async function getAndClearArtifactFromClipboard () {
  const session = await auth()
  if (!session?.user?.id) return null

  try {
    const result = await withRedis(async (client) => {
      const data = await client.get(`user-clipboard:${session.user.id}`)
      if (data) {
        await client.del(`user-clipboard:${session.user.id}`)
      }
      return data
    })
    return result ? JSON.parse(result) : null
  } catch (error) {
    console.error('REDIS_CLIPBOARD_GET_ERROR', error)
    return null
  }
}

// END OF: app/(main)/artifacts/actions.ts
