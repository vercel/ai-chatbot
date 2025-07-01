"use client";

import { useEffect, useState } from "react";
import i18next from "i18next";
import { useTheme } from "next-themes";
import { ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getOAuthUserName } from "@ai-chat/auth/use-auth-config";
import { toast } from "./toast";
import {
  CheckCircleFillIcon,
  CrossIcon,
  LoaderIcon,
  WarningIcon,
} from "./icons";
import { Avatar } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import {
  GenericDialog,
  GenericDialogAction,
  GenericDialogContent,
  GenericDialogDescription,
  GenericDialogFooter,
  GenericDialogHeader,
  GenericDialogTitle,
} from "./ui/generic-dialog";
import { ModeSelector } from "./mode-selector";
import {
  ChatModeKeyOptions,
  LanguageKeyOptions,
  LanguageOption,
} from "@ai-chat/app/api/models";
import { Button } from "./ui/button";
import { Dropdown } from "./ui/dropdown";
import {
  ThemeTypeOptions,
  themeTypes,
  useCoreContext,
} from "@ai-chat/app/core-context";

export const languageTypes: LanguageOption[] = [
  {
    key: LanguageKeyOptions.English,
    display_name: "English",
  },
  {
    key: LanguageKeyOptions.Espanol,
    display_name: "Español",
  },
  {
    key: LanguageKeyOptions.Francais,
    display_name: "Français",
  },
];

export function SidebarUserNav({ user }: { user: any }) {
  const { setTheme, resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const { chatModes, knowledgeBases, languageModels } = useCoreContext();

  /* when this settings menu mounts, capture the current settings into two states:
   * initialSettings to compare later, tempSettings is used
   * to store temporary preference changes to save to the backend.
   */
  const [initialSettings, setInitialSettings] = useState({
    languageType: languageTypes[0],
    theme: themeTypes[0],
    chatMode: chatModes[0],
    knowledgeBase: knowledgeBases && knowledgeBases[0],
    languageModel: languageModels && languageModels[0],
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
    // setTempSettings(initialSettings);
    setIsSettingsModalOpen(false);
  };

  const handleLanguageTypeChange = (event: string) => {
    const selectedKey = event;
    const selectedLanguage = languageTypes?.find(
      (language) => language.key === selectedKey
    );
    if (selectedLanguage) {
      setTempSettings((prev) => ({ ...prev, languageType: selectedLanguage }));
      i18next.changeLanguage(selectedKey);
    }
  };

  const handleThemeChange = (event: string) => {
    const selectedKey = event;
    const selectedTheme = themeTypes?.find(
      (theme: ThemeTypeOptions) => theme.key === selectedKey
    );
    if (selectedTheme) {
      setTempSettings((prev) => ({ ...prev, theme: selectedTheme }));
      setTheme(selectedKey);
    }
  };

  const handleChatModeChange = (event: string) => {
    const selectedKey = event as ChatModeKeyOptions;
    const selectedChatMode = chatModes.find(
      (chatMode) => chatMode.key === selectedKey
    );
    if (selectedChatMode) {
      setTempSettings((prev) => ({ ...prev, chatMode: selectedChatMode }));
    }
  };

  const handleKnowledgeBaseChange = (event: string) => {
    const selectedKey = event;
    const selectedKnowledgeBase = knowledgeBases?.find(
      (knowledgeBase) => knowledgeBase.key === selectedKey
    );
    if (selectedKnowledgeBase) {
      setTempSettings((prev) => ({
        ...prev,
        knowledgeBase: selectedKnowledgeBase,
      }));
    }
  };

  const handleModelChange = (event: string) => {
    const selectedKey = event;
    const selectedLanguageModel = languageModels?.find(
      (languageModel) => languageModel.key === selectedKey
    );
    if (selectedLanguageModel) {
      setTempSettings((prev) => ({
        ...prev,
        languageModel: selectedLanguageModel,
      }));
    }
  };

  return (
    <SidebarMenu>
      <GenericDialog
        open={isSettingsModalOpen}
        onOpenChange={() => {
          console.info("onOpenChange");
        }}
      >
        <GenericDialogContent>
          <GenericDialogHeader className="flex flex-row justify-between">
            <div className="flex flex-col">
              <GenericDialogTitle>
                {t("sideBar.sideMenu.settings")}
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
                  {t("userSettingsDialog.language")}
                </h1>
                <p>{t("userSettingsDialog.selectLanguage")}</p>
              </div>
              <Dropdown
                id="language-setting-dropdown"
                value={tempSettings.languageType?.key || ""}
                onChange={handleLanguageTypeChange}
                options={languageTypes}
              />
            </div>

            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">{t("userSettingsDialog.theme")}</h1>
                <p>{t("userSettingsDialog.selectTheme")}</p>
              </div>
              <Dropdown
                id="theme-setting-dropdown"
                value={tempSettings.theme?.key || ""}
                onChange={handleThemeChange}
                options={themeTypes}
              />
            </div>

            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">
                  {t("userSettingsDialog.defaultChatMode")}
                </h1>
                <p>{t("userSettingsDialog.defaultChatModeDescription")}</p>
              </div>
              <Dropdown
                id="default-chat-mode-settings-dropdown"
                value={tempSettings.chatMode?.key || ""}
                onChange={handleChatModeChange}
                options={chatModes}
              />
            </div>

            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">
                  {t("userSettingsDialog.knowledgeBase")}
                </h1>
                <p>{t("userSettingsDialog.selectKnowledgeBase")}</p>
              </div>
              <Dropdown
                id="knowledge-base-setting-dropdown"
                value={tempSettings.knowledgeBase?.key || ""}
                onChange={handleKnowledgeBaseChange}
                options={knowledgeBases}
              />
            </div>

            <div className="flex flex-row justify-between">
              <div className="flex flex-col">
                <h1 className="font-bold">
                  {t("userSettingsDialog.defaultGPTModel")}
                </h1>
                <p>{t("userSettingsDialog.differentGPTModels")}</p>
              </div>
              <Dropdown
                id="language-model-setting-dropdown"
                value={tempSettings.languageModel?.key || ""}
                onChange={handleModelChange}
                options={languageModels}
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
                      {t("userSettingsDialog.saveSuccess")}
                    </>
                  )}
                  {saveError && (
                    <>
                      <WarningIcon />
                      {t("userSettingsDialog.saveError")}
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
                console.info("onClick");
                setIsSaving(true);
                setTimeout(() => {
                  setIsSaving(false);
                  setSaveSuccess(false);
                  setSaveError(true);
                }, 1500);
              }}
            >
              {isSaving
                ? t("userSettingsDialog.savingChanges")
                : t("userSettingsDialog.saveChanges")}
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
                    {t("sideBar.sideMenu.loadingAuthStatus")}
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
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-settings">
              <button
                type="button"
                className="w-full cursor-pointer"
                onClick={() => {
                  if (isLoading) {
                    toast({
                      type: "error",
                      description:
                        "Checking authentication status, please try again!",
                    });

                    return;
                  }

                  setIsSettingsModalOpen(true);
                }}
              >
                {t("sideBar.sideMenu.settings")}
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
                {t("sideBar.sideMenu.documentation")}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
