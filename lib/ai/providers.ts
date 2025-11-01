import { gateway } from "@ai-sdk/gateway";
import { customProvider, type LanguageModel } from "ai";
import { isTestEnvironment } from "../constants";

const gatewayapikey =
  process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;

if (!gatewayapikey && !isTestEnvironment) {
  console.warn(
    "no ai gateway api key found. set AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN",
  );
}

function creategatewaymodel(modelid: string): LanguageModel {
  return gateway.languageModel(modelid);
}

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
          "anthropic/claude-sonnet-4": chatModel,
          "openai/gpt-4": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : new Proxy(
      { languageModel: (id: string) => creategatewaymodel(id) },
      {
        get(target, prop: string | symbol) {
          const modelid = String(prop);
          if (modelid === "languageModel") {
            return target.languageModel;
          }
          return creategatewaymodel(modelid);
        },
      },
    );
