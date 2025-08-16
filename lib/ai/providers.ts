import { customProvider, extractReasoningMiddleware, wrapLanguageModel } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

// --- Azure OpenAI Environment Detection (Azure-only configuration) ---------
// Required env vars:
//   AZURE_OPENAI_API_KEY
//   AZURE_OPENAI_RESOURCE_NAME   (we intentionally ignore endpoint variant per user request)
//   AZURE_OPENAI_DEPLOYMENT_CHAT (plus optional *_REASONING, *_TITLE, *_ARTIFACT)
const azureApiKey = process.env.AZURE_OPENAI_API_KEY || '';
const azureResourceName = process.env.AZURE_OPENAI_RESOURCE_NAME || '';
const chatDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_CHAT || '';

const hasAzure = Boolean(azureApiKey && azureResourceName && chatDeployment);

if (!hasAzure && !isTestEnvironment) {
  console.warn(
    '[ai] Missing required Azure env vars. Expected AZURE_OPENAI_API_KEY, AZURE_OPENAI_RESOURCE_NAME, AZURE_OPENAI_DEPLOYMENT_CHAT.'
  );
}

const azureProvider = hasAzure
  ? createAzure({
      apiKey: azureApiKey,
      resourceName: azureResourceName,
    })
  : null;

// Resolve deployment (model) names, falling back to chat deployment when optional.
const reasoningDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_REASONING || chatDeployment;
const titleDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_TITLE || chatDeployment;
const artifactDeployment = process.env.AZURE_OPENAI_DEPLOYMENT_ARTIFACT || chatDeployment;

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': azureProvider!(chatDeployment),
        'chat-model-reasoning': wrapLanguageModel({
          model: azureProvider!(reasoningDeployment),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': azureProvider!(titleDeployment),
        'artifact-model': azureProvider!(artifactDeployment),
      },
    });

if (!isTestEnvironment && hasAzure) {
  console.log('[ai] Using Azure OpenAI provider', {
    resourceName: azureResourceName,
    deployments: {
      chat: chatDeployment,
      reasoning: reasoningDeployment,
      title: titleDeployment,
      artifact: artifactDeployment,
    },
  });
}
