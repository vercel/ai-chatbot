'use client';

import { useEffect, useState } from 'react';
import i18next from 'i18next';
import { useTheme } from 'next-themes';
import { ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getOAuthUserName } from '@ai-chat/auth/use-auth-config';
import { toast } from './toast';
import { CheckCircleFillIcon, LoaderIcon } from './icons';
import { Avatar } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './ui/sidebar';
import {
  GenericDialog,
  GenericDialogAction,
  GenericDialogContent,
  GenericDialogDescription,
  GenericDialogFooter,
  GenericDialogHeader,
  GenericDialogTitle,
} from './ui/generic-dialog';
import { ModeSelector } from './mode-selector';
import { ChatModeKeyOptions } from '@ai-chat/app/api/models';

export function SidebarUserNav({ user }: { user: any }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(true);
  const { setTheme, resolvedTheme } = useTheme();

  const userName = getOAuthUserName();

  useEffect(() => {
    if (userName) setIsLoading(false);
  }, [userName]);

  return (
    <SidebarMenu>
      <GenericDialog
        open={isSettingsModalOpen}
        onOpenChange={() => {
          console.info('onOpenChange', { user });
        }}
      >
        <GenericDialogContent>
          <GenericDialogHeader>
            <GenericDialogTitle>
              {t('sideBar.sideMenu.settings')}
            </GenericDialogTitle>
            <GenericDialogDescription>
              Change user settings
            </GenericDialogDescription>
          </GenericDialogHeader>
          <>
            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">
                  {t('userSettingsDialog.language')}
                </h1>
                <p>{t('userSettingsDialog.selectLanguage')}</p>
              </div>
              <ModeSelector
                selectedModeId={ChatModeKeyOptions.Generic}
                className="order-1 md:order-2"
              />
            </div>

            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">{t('userSettingsDialog.theme')}</h1>
                <p>{t('userSettingsDialog.selectTheme')}</p>
              </div>
              <ModeSelector
                selectedModeId={ChatModeKeyOptions.Documents}
                className="order-1 md:order-2"
              />
            </div>

            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">
                  {t('userSettingsDialog.defaultChatMode')}
                </h1>
                <p>{t('userSettingsDialog.defaultChatModeDescription')}</p>
              </div>
              <ModeSelector
                selectedModeId={ChatModeKeyOptions.Generic}
                className="order-1 md:order-2"
              />
            </div>

            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">
                  {t('userSettingsDialog.knowledgeBase')}
                </h1>
                <p>{t('userSettingsDialog.selectKnowledgeBase')}</p>
              </div>
              <ModeSelector
                selectedModeId={ChatModeKeyOptions.Documents}
                className="order-1 md:order-2"
              />
            </div>

            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">
                  {t('userSettingsDialog.defaultGPTModel')}
                </h1>
                <p>{t('userSettingsDialog.differentGPTModels')}</p>
              </div>
              <ModeSelector
                selectedModeId={ChatModeKeyOptions.Generic}
                className="order-1 md:order-2"
              />
            </div>
          </>
          <GenericDialogFooter>
            <div className="flex items-center text-sm gap-1">
              <CheckCircleFillIcon />
              {t('userSettingsDialog.savingChanges')}
            </div>

            <GenericDialogAction
              onClick={() => {
                console.info('onClick', { user });
                setIsSettingsModalOpen(false);
              }}
            >
              {t('userSettingsDialog.saveChanges')}
            </GenericDialogAction>
          </GenericDialogFooter>
        </GenericDialogContent>
      </GenericDialog>

      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isLoading ? (
              <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10 justify-between">
                <div className="flex flex-row gap-2">
                  <div className="size-6 bg-zinc-500/30 rounded-full animate-pulse" />
                  <span className="bg-zinc-500/30 text-transparent rounded-md animate-pulse">
                    {t('sideBar.sideMenu.loadingAuthStatus')}
                  </span>
                </div>
                <div className="animate-spin text-zinc-500">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                data-testid="user-nav-button"
                className="data-[state=open]:bg-sidebar-accent bg-background data-[state=open]:text-sidebar-accent-foreground h-10"
              >
                <Avatar />
                <span data-testid="user-email" className="truncate">
                  {user?.email || userName}
                </span>
                <ChevronUp className="ml-auto" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            data-testid="user-nav-menu"
            side="top"
            className="w-[var(--radix-popper-anchor-width)]"
          >
            {/* TODO: REMOVE THIS COMPONENT AFTER STABLE BASE */}
            <DropdownMenuItem
              data-testid="user-nav-item-theme"
              className="cursor-pointer"
              onSelect={() =>
                setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
              }
            >
              {resolvedTheme === 'light'
                ? t('sideBar.sideMenu.toggleLightMode')
                : t('sideBar.sideMenu.toggleDarkMode')}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            {/* TODO: REMOVE THIS COMPONENT AFTER STABLE BASE */}

            <DropdownMenuItem asChild data-testid="user-nav-item-settings">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  if (isLoading) {
                    toast({
                      type: 'error',
                      description:
                        'Checking authentication status, please try again!',
                    });

                    return;
                  }

                  setIsSettingsModalOpen(true);
                }}
              >
                {t('sideBar.sideMenu.settings')}
              </button>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild data-testid="user-nav-item-documentation">
              <a
                href="/docs"
                role="menuitem"
                target="_blank"
                className="user-actions-menu-paper__item"
                rel="noopener noreferrer"
              >
                {t('sideBar.sideMenu.documentation')}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-settings">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  if (isLoading) {
                    toast({
                      type: 'error',
                      description:
                        'Checking authentication status, please try again!',
                    });

                    return;
                  }

                  i18next.changeLanguage('es');
                }}
              >
                ES
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild data-testid="user-nav-item-settings">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  if (isLoading) {
                    toast({
                      type: 'error',
                      description:
                        'Checking authentication status, please try again!',
                    });

                    return;
                  }

                  i18next.changeLanguage('fr');
                }}
              >
                FR
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem asChild data-testid="user-nav-item-settings">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  if (isLoading) {
                    toast({
                      type: 'error',
                      description:
                        'Checking authentication status, please try again!',
                    });

                    return;
                  }

                  i18next.changeLanguage('en');
                }}
              >
                EN
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
