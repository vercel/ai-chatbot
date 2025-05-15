'use client';

import React, { useCallback, useEffect } from 'react';
import useSWR from 'swr';
import { ToolMetadata } from '../lib/ai/tools';
import { fetcher } from '../lib/utils';

interface ChatSettingContext {
  tools: Record<string, ToolMetadata> | undefined;
  chatSettingConfig: ChatSettingsConfig | undefined;
  setChatSettingConfig: (data: ChatSettingsConfig) => void;
}

const ChatSettingContext = React.createContext<ChatSettingContext | null>(null);

interface ChatSettingConfigTool {
  name: string;
  description?: string;
  enabled: boolean;
}

export interface ChatSettingsConfig {
  tools: Record<string, ChatSettingConfigTool>;
}

const DEFAULT_SETTING_CONFIG: ChatSettingsConfig = {
  tools: {},
};

const useChatSetting = () => {
  const context = React.useContext(ChatSettingContext);
  if (!context) {
    throw new Error('useChatSetting must be used within a ChatSettingProvider');
  }
  return context;
};

const ChatSettingProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: tools } = useSWR<Record<string, ToolMetadata>>(
    '/api/tools',
    fetcher,
  );

  const [availableTools, setAvailableTools] = React.useState<
    Record<string, ToolMetadata>
  >({});

  const [chatSettingConfig, _setChatSettingConfig] = React.useState<
    ChatSettingsConfig | undefined
  >(undefined);

  const setChatSettingConfig = (data: ChatSettingsConfig) => {
    localStorage.setItem('chat-settings-config', JSON.stringify(data));

    _setChatSettingConfig(data);

    if (tools) {
      const filteredTools = Object.entries(data.tools)
        .filter(([_, tool]) => tool.enabled)
        .reduce(
          (acc, [key]) => {
            acc[key] = tools[key];
            return acc;
          },
          {} as Record<string, ToolMetadata>,
        );

      setAvailableTools(filteredTools);
    }
  };

  useEffect(() => {
    if (!tools) {
      return;
    }

    // Load settings from local storage with tools
    const data = localStorage.getItem('chat-settings-config');
    const loadedConfig: ChatSettingsConfig = !data
      ? DEFAULT_SETTING_CONFIG
      : JSON.parse(data);

    for (const [key, tool] of Object.entries(tools)) {
      if (!loadedConfig.tools[key]) {
        loadedConfig.tools[key] = {
          name: key,
          enabled: true,
          description: tool.description,
        };
      }
    }

    // Save the updated settings config to local storage
    localStorage.setItem('chat-settings-config', JSON.stringify(loadedConfig));
    setChatSettingConfig(loadedConfig);

    console.log('Loaded settings', loadedConfig);
  }, [tools]);

  return (
    <ChatSettingContext.Provider
      value={{ tools: availableTools, chatSettingConfig, setChatSettingConfig }}
    >
      {children}
    </ChatSettingContext.Provider>
  );
};

ChatSettingProvider.displayName = 'ChatSettingProvider';

export { ChatSettingProvider, useChatSetting };
