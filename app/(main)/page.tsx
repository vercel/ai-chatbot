/**
 * @file app/(main)/page.tsx
 * @description Страница для создания нового чата.
 * @version 1.5.1
 * @date 2025-06-06
 * @updated Удален неиспользуемый проп `initialVisibilityType`.
 */

/** HISTORY:
 * v1.5.1 (2025-06-06): Удален проп `initialVisibilityType`.
 * v1.5.0 (2025-06-06): Удалена логика discussArtifact, чтобы избежать ошибок с searchParams.
 * v1.4.0 (2025-06-06): Добавлен `export const dynamic` для решения проблемы с `searchParams`.
 * v1.3.0 (2025-06-06): Исправлен доступ к searchParams путем деструктуризации из props.
 * v1.2.0 (2025-06-06): Исправлен доступ к searchParams.
 * v1.1.0 (2025-06-05): Добавлена обработка discussArtifact.
 * v1.0.0 (2025-06-05): Начальная версия.
 */

import { cookies } from 'next/headers';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  return (
    <Chat
      key={id}
      id={id}
      initialMessages={[]}
      initialChatModel={modelIdFromCookie?.value || DEFAULT_CHAT_MODEL}
      isReadonly={false}
      session={session}
      autoResume={false}
    />
  );
}

// END OF: app/(main)/page.tsx
