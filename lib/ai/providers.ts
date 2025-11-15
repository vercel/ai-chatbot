import { createOpenAI } from "@ai-sdk/openai";
import { customProvider, type LanguageModel } from "ai";
import { isTestEnvironment } from "../constants";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const modelMap = {
  "chat-model": openai("gpt-4o"),
  "chat-model-reasoning": openai("gpt-4o"),
  "title-model": openai("gpt-4o-mini"),
  "artifact-model": openai("gpt-4o"),
} as const;

const modelIdMap: Record<keyof typeof modelMap, string> = {
  "chat-model": "gpt-4o",
  "chat-model-reasoning": "gpt-4o",
  "title-model": "gpt-4o-mini",
  "artifact-model": "gpt-4o",
};

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : {
      languageModel: (modelId: string): LanguageModel => {
        const model = modelMap[modelId as keyof typeof modelMap];
        if (!model) {
          throw new Error(`Unknown model: ${modelId}`);
        }
        // @ai-sdk/openai 2.0.67+ returns v2 models (verified: specificationVersion: "v2")
        // TypeScript types may still include v1, so we cast through unknown
        return model as unknown as LanguageModel;
      },
      getModelId: (modelId: string): string | undefined => {
        return modelIdMap[modelId as keyof typeof modelIdMap];
      },
    };
