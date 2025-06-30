'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import i18next from 'i18next';
import { getOAuthUserUniqueName } from '@ai-chat/auth/use-auth-config';
import { Api } from './api/api';
import {
  type ChatMode,
  type KnowledgeBase,
  LanguageKeyOptions,
  type LanguageModel,
  type LanguageOption,
  ThemeOptions,
  type User,
  type UserLanguageOption,
} from './api/models';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@ai-chat/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';

export interface ThemeTypeOptions {
  key: ThemeOptions;
  display_name: string;
  short_description?: string;
}

export const themeTypes = [
  {
    key: ThemeOptions.Dark,
    display_name: 'Dark',
    short_description: 'Dark',
  },
  {
    key: ThemeOptions.Light,
    display_name: 'Light',
    short_description: 'Light',
  },
];

export const languageTypes: LanguageOption[] = [
  {
    key: LanguageKeyOptions.English,
    display_name: 'English',
  },
  {
    key: LanguageKeyOptions.Espanol,
    display_name: 'Español',
  },
  {
    key: LanguageKeyOptions.Francais,
    display_name: 'Français',
  },
];

export interface ContextUserSettings {
  defaultChatMode: ChatMode;
  defaultKnowledgeBase: KnowledgeBase;
  defaultLanguageModel: LanguageModel;
  defaultLanguage: UserLanguageOption;
  defaultTheme: ThemeTypeOptions;
}

// Context for data that is core to the app usage - will gatekeep app rendering without it
const defaultCoreContext = {
  user: undefined as User | undefined,
  chatModes: [] as ChatMode[],
  languageModels: undefined as LanguageModel[] | undefined,
  currentLanguageModel: undefined as LanguageModel | undefined,
  setCurrentLanguageModel: (() => {}) as React.Dispatch<
    React.SetStateAction<LanguageModel | undefined>
  >,
  knowledgeBases: undefined as KnowledgeBase[] | undefined,
  currentKnowledgeBase: undefined as KnowledgeBase | undefined,
  setCurrentKnowledgeBase: (() => {}) as React.Dispatch<
    React.SetStateAction<KnowledgeBase | undefined>
  >,
  touValid: undefined as boolean | undefined,
  setTouValid: (() => {}) as React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >,
  isOpenUserSettings: undefined as boolean | undefined,
  setIsOpenUserSettings: (() => {}) as React.Dispatch<
    React.SetStateAction<boolean | undefined>
  >,
  currentLanguageType: undefined as UserLanguageOption | undefined,
  setCurrentLanguageType: (() => {}) as React.Dispatch<
    React.SetStateAction<UserLanguageOption | undefined>
  >,
  currentTheme: undefined as ThemeTypeOptions | undefined,
  setCurrentTheme: (() => {}) as React.Dispatch<
    React.SetStateAction<ThemeTypeOptions | undefined>
  >,
  selectedLanguage: i18next.resolvedLanguage,
  setSelectedLanguage: (() => {}) as React.Dispatch<
    React.SetStateAction<string | undefined>
  >,
  userSettings: undefined as ContextUserSettings | undefined,
  setUserSettings: (() => {}) as React.Dispatch<
    React.SetStateAction<ContextUserSettings | undefined>
  >,
};

type CoreContextProps = typeof defaultCoreContext;

const CoreContext = createContext<CoreContextProps>(defaultCoreContext);

const CoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | undefined>(undefined);
  const [userError, setUserError] = useState<Error | undefined>(undefined);
  const [chatModes, setChatModes] = useState<ChatMode[]>([]);
  const [languageModels, setLanguageModels] = useState<
    LanguageModel[] | undefined
  >([]);
  const [knowledgeBases, setKnowledgeBases] = useState<
    KnowledgeBase[] | undefined
  >([]);
  const [currentLanguageModel, setCurrentLanguageModel] = useState<
    LanguageModel | undefined
  >(undefined);
  const [currentKnowledgeBase, setCurrentKnowledgeBase] = useState<
    KnowledgeBase | undefined
  >(undefined);
  const [chatModesError, setChatModesError] = useState<Error | undefined>(
    undefined,
  );
  const [touValid, setTouValid] = useState<boolean | undefined>(undefined);
  const [isOpenUserSettings, setIsOpenUserSettings] = useState<
    boolean | undefined
  >(false);
  const [currentLanguageType, setCurrentLanguageType] = useState<
    UserLanguageOption | undefined
  >();
  const [currentTheme, setCurrentTheme] = useState<
    ThemeTypeOptions | undefined
  >();
  const [selectedLanguage, setSelectedLanguage] = useState(
    i18next.resolvedLanguage,
  );
  const [userSettings, setUserSettings] = useState<
    ContextUserSettings | undefined
  >();

  const [alertOpen, setAlertOpen] = useState<boolean>(false);

  useEffect(() => {
    let ignore = false;
    const postUser = async () => {
      if (!user && !userError) {
        try {
          const uniquename = getOAuthUserUniqueName();
          if (!uniquename) {
            setUserError(
              new Error(
                'No user uniquename provided to create/get a new user.',
              ),
            );
            return;
          }

          const res = await Api.postUser();
          if (!ignore) {
            // check if core user data/settings are valid
            if (!res?.id) {
              setUserError(new Error('No valid user identifier retrieved.'));
              return;
            }

            if (!res.user_settings?.chat_modes?.length) {
              setChatModesError(new Error());
              return;
            }

            setUser(res);
            setTouValid(res.tou?.valid);
            setChatModes(res.user_settings?.chat_modes);
            setLanguageModels(res.user_settings?.models_list);
            setKnowledgeBases(res.user_settings?.knowledge_bases);
          }
        } catch (err) {
          if (!ignore) {
            setUserError(
              new Error(
                `Error while creating/getting a user: ${(err as Error).message}`,
              ),
            );
          }
        }
      }
    };

    const handleUserSettings = async (): Promise<void> => {
      try {
        const settings = await Api.getUserSettings();

        const defaultChatMode =
          chatModes.find(
            (chatMode) => chatMode.key === settings.default_chat_mode,
          ) || (chatModes[0] as ChatMode);

        const defaultKnowledgeBase =
          knowledgeBases?.find(
            (knowledgeBase) =>
              knowledgeBase.key === settings.default_knowledge_base,
          ) || (knowledgeBases?.[0] as KnowledgeBase);

        const defaultLanguageModel =
          languageModels?.find(
            (languageModel) => languageModel.key === settings.default_model,
          ) || (languageModels?.[0] as LanguageModel);

        const defaultLanguage =
          languageTypes?.find(
            (languageType) => languageType.key === settings.language,
          ) || (languageTypes[0] as UserLanguageOption);

        const defaultTheme =
          themeTypes.find((themeType) => themeType.key === settings.theme) ||
          (themeTypes[0] as ThemeTypeOptions);

        setUserSettings({
          defaultChatMode,
          defaultKnowledgeBase,
          defaultLanguage,
          defaultLanguageModel,
          defaultTheme,
        });
      } catch (err) {
        console.error(
          `Error while fetching settings: ${(err as Error).message}`,
        );
        setUserSettings({
          defaultChatMode: chatModes[0],
          defaultKnowledgeBase: knowledgeBases?.[0] as KnowledgeBase,
          defaultLanguage: languageTypes[0],
          defaultLanguageModel: languageModels?.[0] as LanguageModel,
          defaultTheme: themeTypes[0],
        });
      }
    };

    postUser();

    if (user) handleUserSettings();

    return () => {
      ignore = true;
    };
  }, [chatModes, knowledgeBases, languageModels, user, userError]);

  if (!user && !userError && !chatModesError) {
    // FIXME
    return <h1>{t('general.loading')}</h1>;
  }

  if (userError) {
    // FIXME
    return (
      <>
        <h1>{t('fullPageStatus.serviceTemporarilyUnavailable')}</h1>
        <p>{t('fullPageStatus.technicalIssues')}</p>
        <p>{t('fullPageStatus.assistance')}</p>
      </>
    );
  }

  if (chatModesError) {
    // FIXME
    const SMTCatalogItemLink =
      'https://smt.ext.icrc.org/esc?id=sc_cat_item&sys_id=e4a1f648cd8c6a90078ad7cac21c584d';

    return (
      <>
        <h1>{t('fullPageStatus.noAvailableChatModes')}</h1>
        <p>{t('fullPageStatus.noAccessChatModes')}</p>
        <p>
          {t('fullPageStatus.requestAccess1')}{' '}
          <a
            href={`${SMTCatalogItemLink}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {t('fullPageStatus.SMTCatalogItemLink')}
          </a>{' '}
          {t('fullPageStatus.requestAccess2')}
        </p>
        <p>{t('fullPageStatus.existingAccess')}</p>
      </>
    );
  }

  return (
    <CoreContext.Provider
      value={{
        user,
        chatModes,
        languageModels,
        currentLanguageModel,
        setCurrentLanguageModel,
        knowledgeBases,
        currentKnowledgeBase,
        setCurrentKnowledgeBase,
        touValid,
        setTouValid,
        isOpenUserSettings,
        setIsOpenUserSettings,
        currentLanguageType,
        setCurrentLanguageType,
        currentTheme,
        setCurrentTheme,
        selectedLanguage,
        setSelectedLanguage,
        userSettings,
        setUserSettings,
      }}
    >
      {!user?.tou?.valid && (
        <AlertDialog
          open={alertOpen}
          onOpenChange={() => {
            console.info('onOpenChange', { user });
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('alertDialog.termsOfUseTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Welcome to FIND, ICRC's AI-powered chatbot! This tool is for
                professional purposes for your job at the ICRC. You acknowledge
                that you have read and understood the AI policy (1-pager), the
                Information Handling Topology (2-pager) and the Acceptable Use
                of Information Systems (1-pager). AI chatbots come at a
                financial cost and have an environmental footprint, please
                refrain from using for personal use and use it responsibly. Your
                interactions are recorded and processed on ICRC data center for
                the purposes of auditability, financial control, application
                improvements. Your or your department/unit accesses may be
                limited or throttled in case of excessive or non-compliant use.
                Data is sent and processed in ICRC public cloud tenant. It is
                therefore prohibited to input strictly confidential information
                in this tool (e.g., sensitive personal data). Chatbots are known
                to hallucinate, always verify the text accuracy. You will remain
                the human responsible of what you do with the chatbot outputs.
                Should you have further questions or comments, please feel free
                to reach out by joining the AI community. By using this service,
                you acknowledge to the above, including how we collect and use
                your data. Enjoy chatting!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={() => {
                  console.info('onClick', { user });
                  setAlertOpen(false);
                }}
              >
                {t('alertDialog.acceptButton')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {children}
    </CoreContext.Provider>
  );
};

const useCoreContext = () => {
  const context = useContext(CoreContext);
  if (!context) {
    throw new Error('useCoreContext must be used within a CoreProvider');
  }
  return context;
};

export { CoreProvider, useCoreContext };
