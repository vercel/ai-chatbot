import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

// Use mock models in tests and when AI Gateway isn't configured (local dev),
// otherwise use the Vercel AI Gateway with xAI models.
export const myProvider = (() => {
  const hasGateway = Boolean(process.env.AI_GATEWAY_API_KEY);

  if (isTestEnvironment || !hasGateway) {
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
  }

  return customProvider({
    languageModels: {
      "chat-model": gateway.languageModel("xai/grok-2-vision-1212"),
      "chat-model-reasoning": wrapLanguageModel({
        model: gateway.languageModel("xai/grok-3-mini"),
        middleware: extractReasoningMiddleware({ tagName: "think" }),
      }),
      "title-model": gateway.languageModel("xai/grok-2-1212"),
      "artifact-model": gateway.languageModel("xai/grok-2-1212"),
    },
  });
})();
