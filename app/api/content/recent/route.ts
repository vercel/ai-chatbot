/**
 * @file app/api/content/recent/route.ts
 * @description API маршрут для получения списка недавних документов пользователя.
 * @version 1.0.0
 * @date 2025-06-06
 * @updated Начальная версия маршрута.
 */

/** HISTORY:
 * v1.0.0 (2025-06-06): Создан маршрут для получения недавних документов.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import { getRecentContentByUserId } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import type { ArtifactKind } from '@/components/artifact'

export const dynamic = 'force-dynamic'

export async function GET (request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:api', 'User not authenticated.').toResponse()
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const kind = searchParams.get('kind') as ArtifactKind | undefined

    const limit = limitParam ? Number.parseInt(limitParam, 10) : 5

    if (Number.isNaN(limit) || limit <= 0 || limit > 20) {
      return new ChatSDKError('bad_request:api', 'Invalid limit parameter. Must be between 1 and 20.').toResponse()
    }

    const recentContent = await getRecentContentByUserId({ userId: session.user.id, limit, kind })

    return NextResponse.json(recentContent)

  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    console.error('SYS_API_CONTENT_RECENT: Unexpected error', error)
    return new ChatSDKError('bad_request:api', 'An unexpected error occurred while fetching recent content.').toResponse()
  }
}

// END OF: app/api/content/recent/route.ts