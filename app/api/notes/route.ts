/**
 * @file app/(notes)/api/notes/route.ts
 * @description API маршрут для получения списка текстовых документов пользователя с пагинацией и поиском.
 * @version 1.0.1
 * @date 2025-06-05
 * @updated Обновлена дата и версия в HISTORY.
 */

/** HISTORY:
 * v1.0.1 (2025-06-05): Обновлена дата и версия в HISTORY. Незначительные изменения не требуются, если getPagedTextDocumentsByUserId исправлен.
 * v1.0.0 (2025-06-05): Начальная версия маршрута для получения списка заметок.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getPagedTextDocumentsByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // SYS_LOGGER.trace({}, 'SYS_APP_API_NOTES_LIST: GET request received');
  try {
    const session = await auth();
    if (!session?.user?.id) {
      // SYS_LOGGER.warn({}, 'SYS_APP_API_NOTES_LIST: Unauthorized access attempt');
      return new ChatSDKError('unauthorized:api', 'User not authenticated.').toResponse();
    }

    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const searchQuery = searchParams.get('searchQuery') || undefined;

    const page = pageParam ? Number.parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? Number.parseInt(pageSizeParam, 10) : 10;

    if (Number.isNaN(page) || page <= 0) {
      // SYS_LOGGER.warn({ pageParam }, 'SYS_APP_API_NOTES_LIST: Invalid page parameter');
      return new ChatSDKError('bad_request:api', 'Invalid page parameter.').toResponse();
    }
    if (Number.isNaN(pageSize) || pageSize <= 0 || pageSize > 50) {
      // SYS_LOGGER.warn({ pageSizeParam }, 'SYS_APP_API_NOTES_LIST: Invalid pageSize parameter');
      return new ChatSDKError('bad_request:api', 'Invalid pageSize parameter. Must be between 1 and 50.').toResponse();
    }

    const queryParams = { userId: session.user.id, page, pageSize, searchQuery };
    // SYS_LOGGER.debug(queryParams, 'SYS_APP_API_NOTES_LIST: Fetching paged text documents');

    const result = await getPagedTextDocumentsByUserId(queryParams);

    // SYS_LOGGER.info({ userId: session.user.id, count: result.data.length, totalCount: result.totalCount }, 'SYS_APP_API_NOTES_LIST: Paged documents fetched successfully');
    return NextResponse.json(result);

  } catch (error) {
    // SYS_LOGGER.error({ err: error }, 'SYS_APP_API_NOTES_LIST: Error fetching paged documents');
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    console.error("SYS_APP_API_NOTES_LIST: Unexpected error", error); // Добавим лог для непредвиденных ошибок
    return new ChatSDKError('bad_request:api', 'An unexpected error occurred while fetching documents.').toResponse();
  }
}

// END OF: app/(notes)/api/notes/route.ts