/**
 * @file app/(notes)/notes/actions.ts
 * @description Server Actions для управления текстовыми заметками.
 * @version 1.0.0
 * @date 2025-06-05
 * @updated Начальная версия с действиями для создания и удаления заметок.
 */

/** HISTORY:
 * v1.0.0 (2025-06-05): Созданы Server Actions createTextNote и deleteTextNote.
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/app/(auth)/auth';
import { saveDocument, deleteDocumentCompletelyById, getDocumentById } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import { ChatSDKError } from '@/lib/errors';

interface CreateTextNoteResult {
  success: boolean;
  documentId?: string;
  title?: string;
  error?: string;
  errorCode?: string;
}

export async function createTextNote(formData: FormData): Promise<CreateTextNoteResult> {
  // SYS_LOGGER.trace({ formData }, 'SYS_APP_NOTES_ACTIONS: createTextNote called');
  const session = await auth();
  if (!session?.user?.id) {
    // SYS_LOGGER.warn({}, 'SYS_APP_NOTES_ACTIONS: Unauthorized createTextNote attempt');
    return { success: false, error: 'Пользователь не авторизован.', errorCode: 'unauthorized:document' };
  }

  const title = formData.get('title') as string | null;
  const content = formData.get('content') as string | null; // Опционально, если хотим передать начальный контент

  const noteTitle = title?.trim() || `Новая заметка ${new Date().toLocaleString()}`;
  const noteContent = content || ''; // Пустой контент по умолчанию
  const documentId = generateUUID();

  try {
    // SYS_LOGGER.debug({ userId: session.user.id, title: noteTitle, documentId }, 'SYS_APP_NOTES_ACTIONS: Saving new text note');
    await saveDocument({
      id: documentId,
      title: noteTitle,
      content: noteContent,
      kind: 'text',
      userId: session.user.id,
    });

    // SYS_LOGGER.info({ documentId, userId: session.user.id }, 'SYS_APP_NOTES_ACTIONS: Text note created successfully');
    revalidatePath('/notes'); // Обновить кеш страницы со списком заметок
    // revalidatePath(`/text-editor/${documentId}`); // Если есть отдельная страница для редактора
    return { success: true, documentId, title: noteTitle };
  } catch (error) {
    // SYS_LOGGER.error({ err: error, userId: session.user.id, title: noteTitle }, 'SYS_APP_NOTES_ACTIONS: Error creating text note');
    if (error instanceof ChatSDKError) {
      return { success: false, error: error.message, errorCode: `${error.type}:${error.surface}` };
    }
    return { success: false, error: 'Не удалось создать заметку.', errorCode: 'bad_request:document' };
  }
}

interface DeleteTextNoteResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export async function deleteTextNote(documentId: string): Promise<DeleteTextNoteResult> {
  // SYS_LOGGER.trace({ documentId }, 'SYS_APP_NOTES_ACTIONS: deleteTextNote called');
  const session = await auth();
  if (!session?.user?.id) {
    // SYS_LOGGER.warn({ documentId }, 'SYS_APP_NOTES_ACTIONS: Unauthorized deleteTextNote attempt');
    return { success: false, error: 'Пользователь не авторизован.', errorCode: 'unauthorized:document' };
  }

  try {
    // Дополнительная проверка, что документ действительно принадлежит пользователю перед удалением.
    // getDocumentById вернет последнюю версию, ее достаточно для проверки userId.
    const doc = await getDocumentById({ id: documentId });
    if (!doc || doc.userId !== session.user.id) {
      // SYS_LOGGER.warn({ documentId, userId: session.user.id, actualUserId: doc?.userId }, 'SYS_APP_NOTES_ACTIONS: Forbidden deleteTextNote attempt or document not found');
      return { success: false, error: 'Заметка не найдена или доступ запрещен.', errorCode: 'forbidden:document' };
    }

    // SYS_LOGGER.debug({ documentId, userId: session.user.id }, 'SYS_APP_NOTES_ACTIONS: Deleting text note');
    await deleteDocumentCompletelyById({ documentId, userId: session.user.id });
    // SYS_LOGGER.info({ documentId, userId: session.user.id }, 'SYS_APP_NOTES_ACTIONS: Text note deleted successfully');

    revalidatePath('/notes');
    return { success: true };
  } catch (error) {
    // SYS_LOGGER.error({ err: error, documentId, userId: session.user.id }, 'SYS_APP_NOTES_ACTIONS: Error deleting text note');
    if (error instanceof ChatSDKError) {
      return { success: false, error: error.message, errorCode: `${error.type}:${error.surface}` };
    }
    return { success: false, error: 'Не удалось удалить заметку.', errorCode: 'bad_request:document' };
  }
}

// END OF: app/(notes)/notes/actions.ts