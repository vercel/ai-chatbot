import { LanguageModelV1 } from '@ai-sdk/provider';
import {
  OpenAICompatibleChatLanguageModel,
} from '@ai-sdk/openai-compatible';
import {
  FetchFunction,
  loadApiKey,
  withoutTrailingSlash,
} from '@ai-sdk/provider-utils';
import {
  GaladrielModelId,
  GaladrielSettings,
} from './galadriel-settings';

export interface GaladrielProviderSettings {
  /**
   * Use a different URL prefix for API calls.
   * The default prefix is `http://localhost:8000`.
   */
  baseURL?: string;
  /**
   * Custom headers to include in the requests.
   */
  headers?: Record<string, string>;
  /**
   * Optional custom url query parameters to include in request urls.
   */
  queryParams?: Record<string, string>;
  /**
   * Custom fetch implementation.
   */
  fetch?: FetchFunction;
}

export interface GaladrielProvider {
  (modelId: GaladrielModelId, settings?: GaladrielSettings): LanguageModelV1;
  chatModel(modelId: GaladrielModelId, settings?: GaladrielSettings): LanguageModelV1;
}

export function createGaladriel(
  options: GaladrielProviderSettings = {},
): GaladrielProvider {
  const baseURL = withoutTrailingSlash(options.baseURL ?? 'http://localhost:8000');
  const getHeaders = () => ({
    ...options.headers,
  });

  interface CommonModelConfig {
    provider: string;
    url: ({ path }: { path: string }) => string;
    headers: () => Record<string, string>;
    fetch?: FetchFunction;
  }

  const getCommonModelConfig = (modelType: string): CommonModelConfig => ({
    provider: `galadriel.${modelType}`,
    url: ({ path }) => {
      const url = new URL(`${baseURL}${path}`);
      if (options.queryParams) {
        url.search = new URLSearchParams(options.queryParams).toString();
      }
      return url.toString();
    },
    headers: getHeaders,
    fetch: options.fetch,
  });

  const createChatModel = (
    modelId: GaladrielModelId,
    settings: GaladrielSettings = {},
  ) => {
    return new OpenAICompatibleChatLanguageModel(modelId, settings, {
      ...getCommonModelConfig('chat'),
      defaultObjectGenerationMode: 'json',
    });
  };

  const provider = (
    modelId: GaladrielModelId,
    settings?: GaladrielSettings,
  ) => createChatModel(modelId, settings);

  provider.chatModel = createChatModel;

  return provider;
}

export const galadriel = createGaladriel();