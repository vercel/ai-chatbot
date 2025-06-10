/**
 * @file app/api/artifacts/recent/route.ts
 * @description API маршрут для получения списка недавних артефактов пользователя.
 * @version 1.2.0
 * @date 2025-06-10
 * @updated Импорт ArtifactKind теперь из общего файла lib/types.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import { getRecentArtifactsByUserId } from '@/lib/db/queries'
import { ChatSDKError } from '@/lib/errors'
import type { ArtifactKind } from '@/lib/types' // <-- ИЗМЕНЕН ИМПОРТ

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

    const recentArtifacts = await getRecentArtifactsByUserId({ userId: session.user.id, limit, kind })

    return NextResponse.json(recentArtifacts)

  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    console.error('SYS_API_ARTIFACTS_RECENT: Unexpected error', error)
    return new ChatSDKError('bad_request:api', 'An unexpected error occurred while fetching recent artifacts.').toResponse()
  }
}

// END OF: app/api/artifacts/recent/route.ts
