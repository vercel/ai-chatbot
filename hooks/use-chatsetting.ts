'use client';

import useSWR from 'swr';
import type { MCPServerConfig } from '@/lib/ai/mcp';

export interface ChatSetting {
  mcpServers: Record<string, MCPServerConfig>;
  availableTools?: string[];
  showAddServerForm?: boolean;
}

export const DEFAULT_CHAT_SETTING: ChatSetting = {
  mcpServers: {
    calculator: {
      name: 'calculator',
      command: 'node',
      args: ['./mcp-servers/calculator/index.js'],
      type: 'stdio',
      enabled: true,
      available: true,
    },
    pokemon: {
      name: 'pokemon',
      command: 'node',
      args: ['./mcp-servers/pokemon/index.js'],
      type: 'stdio',
      enabled: true,
      available: true,
    },
    pingpong: {
      name: 'pingpong',
      url: 'https://mcp-example-iota.vercel.app/api/mcp',
      type: 'remote',
      enabled: true,
      available: true,
    },
    roll_dice: {
      name: 'roll_dice',
      url: 'https//localhost:3000/api/mcp',
      type: 'remote',
      enabled: true,
      available: true,
    },
  },
  availableTools: [],
  showAddServerForm: false,
};

const STORAGE_KEY = 'chat-setting';

function fetcher(): ChatSetting {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : DEFAULT_CHAT_SETTING;
}

export function useChatSetting(): {
  chatSetting: ChatSetting | undefined;
  setChatSetting: (data: ChatSetting) => void;
} {
  const { data: chatSetting, mutate: _setChatSetting } = useSWR<ChatSetting>(
    STORAGE_KEY,
    fetcher,
  );

  const setChatSetting = (data: ChatSetting) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    _setChatSetting({ ...data }, false);
  };

  return { chatSetting, setChatSetting };
}

export function fetchMCPServerConfigs(): Record<string, MCPServerConfig> {
  return fetcher().mcpServers;
}
