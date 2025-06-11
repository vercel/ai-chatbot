/**
 * @file app/api/artifacts/route.ts
 * @description API маршрут для получения артефактов пользователя с пагинацией и поиском.
 * @version 1.1.0
 * @date 2025-06-10
 * @updated Импорт ArtifactKind теперь из общего файла lib/types.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/app/(auth)/auth'
import { getPagedArtifactsByUserId } from '@/lib/db/queries'
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
    const pageParam = searchParams.get('page')
    const pageSizeParam = searchParams.get('pageSize')
    const searchQuery = searchParams.get('searchQuery') || undefined
    const kind = searchParams.get('kind') as ArtifactKind | undefined

    const page = pageParam ? Number.parseInt(pageParam, 10) : 1
    const pageSize = pageSizeParam ? Number.parseInt(pageSizeParam, 10) : 10

    if (Number.isNaN(page) || page <= 0) {
      return new ChatSDKError('bad_request:api', 'Invalid page parameter.').toResponse()
    }
    if (Number.isNaN(pageSize) || pageSize <= 0 || pageSize > 50) {
      return new ChatSDKError('bad_request:api', 'Invalid pageSize parameter. Must be between 1 and 50.').toResponse()
    }

    const queryParams = { userId: session.user.id, page, pageSize, searchQuery, kind }

    const result = await getPagedArtifactsByUserId(queryParams)

    return NextResponse.json(result)

  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    console.error('SYS_API_ARTIFACTS_LIST: Unexpected error', error)
    return new ChatSDKError('bad_request:api', 'An unexpected error occurred while fetching artifacts.').toResponse()
  }
}

// END OF: app/api/artifacts/route.ts
