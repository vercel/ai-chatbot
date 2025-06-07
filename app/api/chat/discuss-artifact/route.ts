/**
 * @file app/api/chat/discuss-artifact/route.ts
 * @description API маршрут для создания чата с контекстом артефакта.
 * @version 1.2.1
 * @date 2025-06-06
 * @updated Исправлена ошибка доступа к свойствам документа после изменения структуры getDocumentById.
 */

/** HISTORY:
 * v1.2.1 (2025-06-06): Исправлен доступ к свойствам документа.
 * v1.2.0 (2025-06-06): Добавлено автоматическое ответное сообщение от ассистента.
 * v1.1.0 (2025-06-06): Изменена структура сообщения на `tool-invocation`.
 * v1.0.0 (2025-06-06): Начальная версия.
 */

import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getDocumentById, saveChat, saveMessages } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';
import { ChatSDKError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const assistantResponses = [
    "Отлично, давайте обсудим. Готов приступать!",
    "Хорошо! Готов к обсуждению. Какие у вас есть вопросы?",
    "Документ перед глазами. С чего начнем?",
    "Конечно, давайте поговорим об этом. Что вы хотите узнать?",
];

function getRandomResponse() {
    const randomIndex = Math.floor(Math.random() * assistantResponses.length);
    return assistantResponses[randomIndex];
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new ChatSDKError('unauthorized:api', 'Пользователь не авторизован.').toResponse();
    }

    const { searchParams } = new URL(request.url);
    const artifactId = searchParams.get('artifactId');

    if (!artifactId) {
      return new ChatSDKError('bad_request:api', 'artifactId является обязательным параметром.').toResponse();
    }

    const documentResult = await getDocumentById({ id: artifactId });
    if (!documentResult || !documentResult.doc || documentResult.doc.userId !== session.user.id) {
      return new ChatSDKError('forbidden:api', 'Документ не найден или доступ запрещен.').toResponse();
    }

    const document = documentResult.doc;

    const newChatId = generateUUID();
    const newChatTitle = `Обсуждение: ${document.title}`;

    await saveChat({
      id: newChatId,
      userId: session.user.id,
      title: newChatTitle,
      visibility: 'private',
    });

    const userMessage = {
      id: generateUUID(),
      chatId: newChatId,
      role: 'user',
      parts: [
        { type: 'text', text: 'Давайте обсудим следующий документ:' },
        {
          type: 'tool-invocation',
          toolInvocation: {
            toolName: 'createDocument',
            toolCallId: generateUUID(),
            state: 'result',
            args: {},
            result: {
              id: document.id,
              title: document.title,
              kind: document.kind,
              content: `Документ "${document.title}" добавлен в чат для обсуждения.`,
            },
          }
        }
      ],
      attachments: [],
      createdAt: new Date(),
    };

    const assistantMessage = {
      id: generateUUID(),
      chatId: newChatId,
      role: 'assistant',
      parts: [{ type: 'text', text: getRandomResponse() }],
      attachments: [],
      createdAt: new Date(Date.now() + 1), // Чуть позже, для порядка
    };

    await saveMessages({
      messages: [userMessage, assistantMessage],
    });

    const chatUrl = new URL(`/chat/${newChatId}`, request.url);
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
