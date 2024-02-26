import { toast } from 'react-hot-toast'
import { LLM, LLMID, OpenRouterLLM } from '@/types'
import { LLM_LIST_MAP } from './llm/llm-list'

export const fetchHostedModels = async () => {
  try {
    const response = await fetch('/api/keys')

    if (!response.ok) {
      throw new Error(`Server is not responding.`)
    }

    const data = await response.json()
    let modelsToAdd: LLM[] = []

    for (const [provider, isEnabled] of Object.entries(data.isUsingEnvKeyMap)) {
      if (isEnabled) {
        const models = LLM_LIST_MAP[provider]
        if (Array.isArray(models)) {
          modelsToAdd.push(...models)
        }
      }
    }

    return {
      envKeyMap: data.isUsingEnvKeyMap,
      hostedModels: modelsToAdd
    }
  } catch (error) {
    console.warn('Error fetching hosted models: ' + error)
    return {
      envKeyMap: {},
      hostedModels: []
    }
  }
}

export const fetchOpenRouterModels = async () => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models')

    if (!response.ok) {
      throw new Error(`OpenRouter server is not responding.`)
    }

    const { data } = await response.json()

    const openRouterModels = data.map(
      (model: {
        id: string
        name: string
        context_length: number
      }): OpenRouterLLM => ({
        modelId: model.id as LLMID,
        modelName: model.id,
        provider: 'openrouter',
        hostedId: model.name,
        platformLink: 'https://openrouter.dev',
        imageInput: false,
        maxContext: model.context_length
      })
    )

    return openRouterModels
  } catch (error) {
    toast.error('Error fetching Open Router models: ' + error)
  }
}
