/**
 * @file app/(chat)/api/documents/recent/route.ts
 * @description API маршрут для получения списка недавних документов пользователя.
 * @version 1.0.1
 * @date 2025-06-05
 * @updated Обновлена дата и версия в HISTORY.
 */

/** HISTORY:
 * v1.0.1 (2025-06-05): Обновлена дата и версия в HISTORY. Незначительные изменения не требуются, если getRecentTextDocumentsByUserId исправлен.
 * v1.0.0 (2025-06-05): Начальная версия маршрута.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getRecentTextDocumentsByUserId } from '@/lib/db/queries';
import { ChatSDKError } from '@/lib/errors';
import type { ArtifactKind } from '@/components/artifact';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // SYS_LOGGER.trace({}, 'SYS_APP_API_DOC_RECENT: GET request received');
  try {
    const session = await auth();

    if (!session?.user?.id) {
      // SYS_LOGGER.warn({}, 'SYS_APP_API_DOC_RECENT: Unauthorized access attempt');
      return new ChatSDKError('unauthorized:api', 'User not authenticated.').toResponse();
    }

    const { searchParams } = new URL(request.url);
    const kind = searchParams.get('kind') as ArtifactKind | null;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 5;

    if (isNaN(limit) || limit <= 0 || limit > 20) {
        // SYS_LOGGER.warn({ limitParam }, 'SYS_APP_API_DOC_RECENT: Invalid limit parameter');
        return new ChatSDKError('bad_request:api', 'Invalid limit parameter. Must be between 1 and 20.').toResponse();
    }

    if (!kind || kind !== 'text') { // Пока поддерживаем только текстовые документы для этого эндпоинта
        // SYS_LOGGER.warn({ kind }, 'SYS_APP_API_DOC_RECENT: Invalid or unsupported kind parameter');
        return new ChatSDKError('bad_request:api', "Invalid or unsupported 'kind' parameter. Only 'text' is currently supported for recent documents.").toResponse();
    }

    // SYS_LOGGER.debug({ userId: session.user.id, limit, kind }, 'SYS_APP_API_DOC_RECENT: Fetching recent documents');
    const documents = await getRecentTextDocumentsByUserId({
      userId: session.user.id,
      limit,
      kind,
    });

    // SYS_LOGGER.info({ userId: session.user.id, count: documents.length }, 'SYS_APP_API_DOC_RECENT: Recent documents fetched successfully');
    return NextResponse.json(documents);

  } catch (error) {
    // SYS_LOGGER.error({ err: error }, 'SYS_APP_API_DOC_RECENT: Error fetching recent documents');
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    console.error("SYS_APP_API_DOC_RECENT: Unexpected error", error); // Добавим лог для непредвиденных ошибок
    return new ChatSDKError('bad_request:api', 'An unexpected error occurred while fetching recent documents.').toResponse();
  }
}

// END OF: app/(chat)/api/documents/recent/route.ts