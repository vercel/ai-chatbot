import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";
import { titleModel } from "./models";

export const HYPO_PROVIDER = "@HypO";
const HYPO_PREFIX = `${HYPO_PROVIDER}/`;

// Custom provider (OpenAI-compatible), base URL + key from .env
export const hypO = createOpenAICompatible({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? "",
  baseURL: process.env.AI_GATEWAY_BASE_URL ?? "",
  name: HYPO_PROVIDER,
});

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        chatModel,
        titleModel: mockTitleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "title-model": mockTitleModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  return hypO.chatModel(modelId.replace(HYPO_PREFIX, ""));
}

export function getTitleModel() {
  return getLanguageModel(titleModel.id);
}
