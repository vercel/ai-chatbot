/**
 * @file app/api/chat/discuss-artifact/route.ts
 * @description API маршрут для создания чата с контекстом артефакта.
 * @version 1.0.0
 * @date 2025-06-06
 * @updated Начальная версия.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getDocumentById, saveChat, saveMessages } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import { ChatSDKError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:api', 'Пользователь не авторизован.').toResponse();
    }

    const { searchParams } = new URL(request.url);
    const artifactId = searchParams.get('artifactId');
    let chatId = searchParams.get('chatId');

    if (!artifactId) {
      return new ChatSDKError('bad_request:api', 'artifactId является обязательным параметром.').toResponse();
    }

    const document = await getDocumentById({ id: artifactId });
    if (!document || document.userId !== session.user.id) {
      return new ChatSDKError('forbidden:api', 'Документ не найден или доступ запрещен.').toResponse();
    }

    const messageContent = `Давай обсудим этот документ: [${document.title}](/notes?openDocId=${document.id})`;
    const messageId = generateUUID();

    // Если chatId не предоставлен, создаем новый чат
    if (!chatId) {
      const newChatId = generateUUID();
      const newChatTitle = `Обсуждение: ${document.title}`;

      await saveChat({
        id: newChatId,
        userId: session.user.id,
        title: newChatTitle,
        visibility: 'private',
      });
      chatId = newChatId;
    }

    // Добавляем системное/пользовательское сообщение в чат
    await saveMessages({
      messages: [{
        id: messageId,
        chatId: chatId,
        role: 'user', // Отображаем как сообщение пользователя для наглядности
        parts: [{ type: 'text', text: messageContent }],
        attachments: [],
        createdAt: new Date(),
      }],
    });

    // Редирект на страницу чата
    const chatUrl = new URL(`/chat/${chatId}`, request.url);
    return NextResponse.redirect(chatUrl.toString());

  } catch (error) {
    console.error('SYS_API_DISCUSS_ARTIFACT: Ошибка при создании чата для обсуждения артефакта', error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new ChatSDKError('bad_request:api', 'Не удалось создать чат для обсуждения.').toResponse();
  }
}

// END OF: app/api/chat/discuss-artifact/route.ts
