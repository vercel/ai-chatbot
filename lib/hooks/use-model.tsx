'use client'

import { createContext, useContext } from 'react';
import { useLocalStorage } from './use-local-storage';

interface ModelContext {
  selectedModel: string
  onSelectModel: (newModel: string) => void
}

const ModelContext = createContext<ModelContext | undefined>(undefined);

export const useModelContext = () => {
  const context = useContext(ModelContext);
  
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider')
  }
  return context
};


interface ModelProviderProps {
  children: React.ReactNode
}

export const ModelProvider = ({ children }: ModelProviderProps) => {
  const [selectedModel, setSelectedModel] = useLocalStorage('ai-model', 'openchat/openchat-7b:free');

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
  };

  return (
    <ModelContext.Provider value={{ selectedModel, onSelectModel: handleModelChange }}>
      {children}
    </ModelContext.Provider>
  );
};
