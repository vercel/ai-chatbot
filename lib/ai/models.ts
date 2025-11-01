import { unstable_cache as cache } from "next/cache";

export const DEFAULT_CHAT_MODEL: string = "anthropic/claude-sonnet-4";

export type ChatModel = {
  id: string;
  name: string;
  description: string;
};

type GatewayModel = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

async function fetchmodels(): Promise<ChatModel[]> {
  const apikey =
    process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;

  if (!apikey) {
    console.warn("no ai gateway api key found, using fallback models");
    return [
      {
        id: "anthropic/claude-sonnet-4",
        name: "claude sonnet 4",
        description: "anthropic's most capable model",
      },
    ];
  }

  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
      headers: {
        authorization: `bearer ${apikey}`,
        "content-type": "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    const models: GatewayModel[] = data.data || [];

    return models
      .map((model) => ({
        id: model.id,
        name: formatmodelname(model.id),
        description: `${model.owned_by} model`,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("error fetching models from gateway:", error);
    return [
      {
        id: "anthropic/claude-sonnet-4",
        name: "claude sonnet 4",
        description: "anthropic's most capable model",
      },
    ];
  }
}

function formatmodelname(modelid: string): string {
  const parts = modelid.split("/");
  const name = parts.at(-1) ?? modelid;

  return name
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const getchatmodels = cache(
  async () => await fetchmodels(),
  ["chat-models"],
  {
    revalidate: 3600,
    tags: ["chat-models"],
  }
);
