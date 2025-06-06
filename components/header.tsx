/**
 * @file components/header.tsx
 * @description Глобальный тулбар (шапка) приложения.
 * @version 1.2.0
 * @date 2025-06-06
 * @updated Добавлена подсветка кнопки "Share", если чат публичный. Исправлен className у иконок.
 */

/** HISTORY:
 * v1.2.0 (2025-06-06): Добавлена подсветка кнопки "Share".
 * v1.1.0 (2025-06-05): Убран ModelSelector, обновлен вызов SidebarUserNav.
 * v1.0.0 (2025-06-05): Начальная версия компонента.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { PlusIcon, ShareIcon } from '@/components/icons';
import { ShareDialog } from './share-dialog';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import * as Package from '../package.json';
import type { VisibilityType } from '@/lib/types';

interface ActiveChatContext {
  chatId: string;
  visibility: VisibilityType;
}

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: activeChatContext } = useSWR<ActiveChatContext | null>('active-chat-context', null, { fallbackData: null });
  const [isShareDialogOpen, setShareDialogOpen] = React.useState(false);

  const chatVisibilityHook = useChatVisibility({
    chatId: activeChatContext?.chatId,
    initialVisibilityType: activeChatContext?.visibility,
  });

  return (
    <header className="sticky top-0 z-50 flex h-14 w-full shrink-0 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Link href="/" className="font-bold text-lg">
          {Package.appName}
        </Link>
      </div>

      <div className="flex items-center justify-end gap-2">
         <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              router.push('/');
              router.refresh();
            }}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            New Chat
        </Button>
        {activeChatContext && chatVisibilityHook && (
          <>
            <Button
              variant={chatVisibilityHook.visibilityType === 'public' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setShareDialogOpen(true)}
            >
              <ShareIcon className="mr-2 h-4 w-4" />
              Share
            </Button>
            <ShareDialog
              chatId={activeChatContext.chatId}
              visibility={chatVisibilityHook.visibilityType}
              onVisibilityChange={chatVisibilityHook.setVisibilityType}
              open={isShareDialogOpen}
              onOpenChange={setShareDialogOpen}
            />
          </>
        )}
        <ThemeSwitcher />
        {session?.user && <SidebarUserNav user={session.user} />}
      </div>
    </header>
  );
}

// END OF: components/header.tsx
