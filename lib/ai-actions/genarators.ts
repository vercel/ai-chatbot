import { generateActionRegistryFunctions } from 'ai-actions'
import { getMutableAIState } from 'ai/rsc/dist'
import { z } from 'zod'

export const { createAIChatbotAction, createAIChatbotActionsRegistry } =
  generateActionRegistryFunctions({
    namespace: 'AIChatbot',
    metadataSchema: z.object({
      title: z.string()
    }),
    handlerContextSchema: z.object({
      aiState: z.custom<ReturnType<typeof getMutableAIState>>()
    })
  })
