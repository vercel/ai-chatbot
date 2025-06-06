/**
 * @file app/api/content/route.ts
 * @description API маршрут для получения контента пользователя с пагинацией и поиском.
 * @version 1.0.0
 * @date 2025-06-06
 * @updated Начальная версия маршрута.
 */

/** HISTORY:
 * v1.0.0 (2025-06-06): Начальная версия маршрута для получения списка контента.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/(auth)/auth'
import { getPagedContentByUserId } from '@/lib/db/queries'
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

    const result = await getPagedContentByUserId(queryParams)

    return NextResponse.json(result)

  } catch (error) {
    if (error instanceof ChatSDKError) {
      return error.toResponse()
    }
    console.error('SYS_API_CONTENT_LIST: Unexpected error', error)
    return new ChatSDKError('bad_request:api', 'An unexpected error occurred while fetching content.').toResponse()
  }
}

// END OF: app/api/content/route.ts
