import { gateway } from "@ai-sdk/gateway";
import type { LanguageModel } from "ai";

const gatewayapikey =
  process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;

if (!gatewayapikey) {
  console.warn(
    "no ai gateway api key found. set AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN"
  );
}

function creategatewaymodel(modelid: string): LanguageModel {
  return gateway.languageModel(modelid);
}

export const myProvider = new Proxy(
  { languageModel: (id: string) => creategatewaymodel(id) },
  {
    get(target, prop: string | symbol) {
      const modelid = String(prop);
      if (modelid === "languageModel") {
        return target.languageModel;
      }
      return creategatewaymodel(modelid);
    },
  }
);
