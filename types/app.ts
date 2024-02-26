import { Dispatch, SetStateAction } from "react"
import { ChatSettings } from "."
import { LLM, OpenRouterLLM } from "."
import { VALID_ENV_KEYS } from "@/types/valid-keys"

export interface AppContext {
  // CHAT STORE
  chatSettings: ChatSettings
  setChatSettings: Dispatch<SetStateAction<ChatSettings>>

  // MODELS STORE
  availableHostedModels: LLM[]
  setAvailableHostedModels: Dispatch<SetStateAction<LLM[]>>
  availableOpenRouterModels: OpenRouterLLM[]
  setAvailableOpenRouterModels: Dispatch<SetStateAction<OpenRouterLLM[]>>

  // ENV KEYS STORE
  envKeyMap: Record<string, VALID_ENV_KEYS>
  setEnvKeyMap: Dispatch<SetStateAction<Record<string, VALID_ENV_KEYS>>>
}