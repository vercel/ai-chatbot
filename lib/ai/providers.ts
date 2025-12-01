import { gateway } from "@ai-sdk/gateway";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

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
  : customProvider({
      languageModels: {
        "chat-model": gateway.languageModel("openai/gpt-4.1-mini"),
        "chat-model-reasoning": wrapLanguageModel({
          model: gateway.languageModel("openai/gpt-5-mini"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": gateway.languageModel("openai/gpt-4.1-mini"),
        "artifact-model": gateway.languageModel("openai/gpt-4.1-mini"),
      },
    });
