'use client';

import React, { useEffect, useRef } from 'react';
import { fetchMCPServerConfigs } from '@/hooks/use-chatsetting';
import type { MCPServerConfig, MCPTool } from '@/lib/ai/mcp';
import { queryMCPTools } from '../app/(chat)/actions';
import { toast } from './toast';

interface MCPContext {
  mcpTools: Record<string, MCPTool>;
  mcpServerConfigs: Record<string, MCPServerConfig>;
  selectedMCPTools: string[];
  setSelectedMCPTools: React.Dispatch<React.SetStateAction<string[]>>;
  getSelectedMCPServerConfigs: () => Record<string, MCPServerConfig>;
  refreshMCPTools: () => Promise<void>;
}

const MCPContext = React.createContext<MCPContext | null>(null);

const useMCP = () => {
  const context = React.useContext(MCPContext);
  if (!context) {
    throw new Error('useMCP must be used within a MCPProvider');
  }
  return context;
};

const MCPProvider = ({ children }: { children: React.ReactNode }) => {
  const [mcpTools, setMCPTools] = React.useState<Record<string, MCPTool>>({});
  const [selectedMCPTools, setSelectedMCPTools] = React.useState<string[]>([]);
  const mcpServerConfigsRef = useRef<Record<string, MCPServerConfig>>({});

  const refreshMCPTools = async () => {
    mcpServerConfigsRef.current = fetchMCPServerConfigs();

    const { tools, error } = await queryMCPTools({
      mcpServerConfigs: mcpServerConfigsRef.current,
    });

    if (error) {
      toast({
        type: 'error',
        description: `Failed to fetch MCP tools: ${error}`,
      });
      return;
    }

    setMCPTools(JSON.parse(tools));
  };

  const getSelectedMCPServerConfigs = () => {
    return Object.entries(mcpServerConfigsRef.current).reduce(
      (acc, [name, config]) => {
        if (selectedMCPTools.includes(name) || selectedMCPTools.length === 0) {
          acc[name] = config;
        }
        return acc;
      },
      {} as Record<string, MCPServerConfig>,
    );
  };

  useEffect(() => {
    refreshMCPTools();
  }, []);

  return (
    <MCPContext.Provider
      value={{
        mcpTools,
        selectedMCPTools,
        setSelectedMCPTools,
        refreshMCPTools,
        mcpServerConfigs: mcpServerConfigsRef.current,
        getSelectedMCPServerConfigs,
      }}
    >
      {children}
    </MCPContext.Provider>
  );
};

MCPProvider.displayName = 'MCPProvider';

export { MCPProvider, useMCP };
