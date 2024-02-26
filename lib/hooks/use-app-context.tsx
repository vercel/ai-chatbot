'use client'

import React, { useContext, createContext, useEffect, useState, FC } from "react"
import { LLM, ChatSettings, AppContext, OpenRouterLLM } from "@/types"
import { fetchHostedModels, fetchOpenRouterModels } from "../models/fetch-models"

const LOCAL_STORAGE_KEYS = {
  chatSettings: 'app_chatSettings',
}

const AppContext = createContext<AppContext | undefined>(undefined)

export function useAppContext() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('AppContext must be used within a AppProvider')
  }
  return context
}

interface AppProviderProps {
  children: React.ReactNode
}

const defaultChatSettings: ChatSettings = {
  model: "gpt-4-turbo-preview",
  prompt: "You are a helpful AI assistant.",
  temperature: 0.5,
  contextLength: 4000,
  embeddingsProvider: "openai",
}

export const AppProvider: FC<AppProviderProps> = ({ children }) => {
  // CHAT STORE
  const [chatSettings, setChatSettings] = useState<ChatSettings>(defaultChatSettings)

  // MODELS STORE
  const [availableHostedModels, setAvailableHostedModels] = useState<LLM[]>([])
  const [availableOpenRouterModels, setAvailableOpenRouterModels] = useState<
    OpenRouterLLM[]
  >([])

  // ENV KEYS STORE
  const [envKeyMap, setEnvKeyMap] = useState({})
  
  const [isLoadedFromLocalStorage, setIsLoadedFromLocalStorage] = useState(false)

  useEffect(() => {
    const loadFromLocalStorage = <T,>(key: keyof typeof LOCAL_STORAGE_KEYS, defaultValue: T): T => {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEYS[key])
      return stored ? JSON.parse(stored) : defaultValue
    }

    setChatSettings(loadFromLocalStorage('chatSettings', defaultChatSettings))

    const fetchModels = async () => {
      const data = await fetchHostedModels()

      if (data) {
        setEnvKeyMap(data.envKeyMap)
        setAvailableHostedModels(data.hostedModels)

        if (data.envKeyMap["openrouter"]) {
          const openRouterModels = await fetchOpenRouterModels()
          if (openRouterModels) {
            setAvailableOpenRouterModels(openRouterModels)
          }
        }
      }
    }

    fetchModels()

    setIsLoadedFromLocalStorage(true)
  }, [])

  useEffect(() => {
    if (!isLoadedFromLocalStorage) {
      return
    }

    const saveToLocalStorage = <T,>(key: keyof typeof LOCAL_STORAGE_KEYS, value: T) => {
      localStorage.setItem(LOCAL_STORAGE_KEYS[key], JSON.stringify(value))
    }

    saveToLocalStorage('chatSettings', chatSettings)
  }, [chatSettings, isLoadedFromLocalStorage])

  return (
    <AppContext.Provider value={{
      envKeyMap, setEnvKeyMap,
      availableHostedModels, setAvailableHostedModels,
      availableOpenRouterModels, setAvailableOpenRouterModels,
      chatSettings, setChatSettings,
    }}>
      {children}
    </AppContext.Provider>
  )
}
