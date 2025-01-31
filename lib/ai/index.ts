import { openai } from "@ai-sdk/openai";
import { fireworks } from "@ai-sdk/fireworks";
import { extractReasoningMiddleware, wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

export const customModel = (
  apiIdentifier: string,
  provider: "openai" | "fireworks"
) => {
  switch (provider) {
    case "openai":
      return wrapLanguageModel({
        model: openai(apiIdentifier),
        middleware: customMiddleware,
      });
    case "fireworks":
      return wrapLanguageModel({
        model: fireworks(apiIdentifier),
        middleware: extractReasoningMiddleware({ tagName: "think" }),
      });
  }
};

export const imageGenerationModel = openai.image("dall-e-3");
