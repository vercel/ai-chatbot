import { openai } from "@ai-sdk/openai";
import { customProvider } from "ai";
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
        // Direct OpenAI provider (no AI Gateway)
        "chat-model": openai("gpt-4o-mini"),
        "chat-model-reasoning": openai("o4-mini"),
        "title-model": openai("gpt-4o-mini"),
        "artifact-model": openai("gpt-4o-mini"),
      },
    });
