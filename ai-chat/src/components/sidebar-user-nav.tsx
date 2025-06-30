'use client';

import { useEffect, useState } from 'react';
import i18next from 'i18next';
import { useTheme } from 'next-themes';
import { ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getOAuthUserName } from '@ai-chat/auth/use-auth-config';
import { toast } from './toast';
import {
  CheckCircleFillIcon,
  CrossIcon,
  LoaderIcon,
  WarningIcon,
} from './icons';
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
import { Button } from './ui/button';

export function SidebarUserNav({ user }: { user: any }) {
  const { setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();

  /* when this settings menu mounts, capture the current settings into two states:
   * initialSettings to compare later, tempSettings is used
   * to store temporary preference changes to save to the backend.
   */
  const [initialSettings, setInitialSettings] = useState({
    languageType: '',
    theme: '',
    chatMode: '',
    knowledgeBase: '',
    languageModel: '',
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState<boolean>(false);
  const [tempSettings, setTempSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // compute whether any of the temporary selections differ from the initial ones.
  const settingsChanged =
    JSON.stringify(tempSettings) !== JSON.stringify(initialSettings);

  const userName = getOAuthUserName();

  useEffect(() => {
    if (userName) setIsLoading(false);
  }, [userName]);

  const closeModal = () => {
    setSaveError(false);
    setSaveSuccess(false);
    setIsSaving(false);
    setTempSettings(initialSettings);
    setIsSettingsModalOpen(false);
  };

  return (
    <SidebarMenu>
      <GenericDialog
        open={isSettingsModalOpen}
        onOpenChange={() => {
          console.info('onOpenChange');
        }}
      >
        <GenericDialogContent>
          <GenericDialogHeader className="flex flex-row justify-between">
            <div className="flex flex-col">
              <GenericDialogTitle>
                {t('sideBar.sideMenu.settings')}
              </GenericDialogTitle>
              <GenericDialogDescription>
                Change user settings
              </GenericDialogDescription>
            </div>
            <Button
              className="cursor-pointer bg-transparent text-white hover:bg-accent"
              onClick={closeModal}
            >
              <CrossIcon />
            </Button>
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
          <GenericDialogFooter className="justify-between items-center">
            <div className="flex items-center text-sm gap-1">
              {(saveSuccess || saveError) && (
                <>
                  {saveSuccess && (
                    <>
                      <CheckCircleFillIcon />
                      {t('userSettingsDialog.saveSuccess')}
                    </>
                  )}
                  {saveError && (
                    <>
                      <WarningIcon />
                      {t('userSettingsDialog.saveError')}
                    </>
                  )}
                </>
              )}
            </div>

            <GenericDialogAction
              className="flex items-center text-sm gap-1"
              disabled={!settingsChanged || isSaving}
              onClick={() => {
                // FIXME: implement actual BE behaviour
                console.info('onClick');
                setIsSaving(true);
                setTimeout(() => {
                  setIsSaving(false);
                  setSaveSuccess(false);
                  setSaveError(true);
                }, 1500);
              }}
            >
              {isSaving
                ? t('userSettingsDialog.savingChanges')
                : t('userSettingsDialog.saveChanges')}
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
