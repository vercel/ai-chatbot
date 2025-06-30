'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import { useWindowSize } from 'usehooks-ts';
import type { ChatModeKeyOptions } from '@ai-chat/app/api/models';
import { useSidebar } from './ui/sidebar';
import { SidebarToggle } from './sidebar-toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { ModeSelector } from './mode-selector';
import { LanguageModelSelector } from './language-model-selector';
import { Button } from './ui/button';
import { PlusIcon } from './icons';
import { useTranslation } from 'react-i18next';

function PureChatHeader({
  selectedModeId,
  isReadonly,
}: {
  selectedModeId: ChatModeKeyOptions;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { t } = useTranslation();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 bg-background py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              className="order-2 md:order-1 md:px-2 px-2 md:h-fit ml-auto md:ml-0"
              onClick={() => {
                router.push('/');
                router.refresh();
              }}
            >
              <PlusIcon />
              <span className="md:sr-only">{t('sideBar.newChat')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('sideBar.newChat')}</TooltipContent>
        </Tooltip>
      )}

      {!isReadonly && (
        <ModeSelector
          selectedModeId={selectedModeId}
          className="order-1 md:order-2"
        />
      )}

      {!isReadonly && (
        <LanguageModelSelector
          selectedModeId={selectedModeId}
          className="order-1 md:order-2"
        />
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return prevProps.selectedModeId === nextProps.selectedModeId;
});
