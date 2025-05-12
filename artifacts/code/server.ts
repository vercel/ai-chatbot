import { z } from 'zod';
import { streamObject } from 'ai';
import { configuredProviders } from '@/lib/ai/providers';
import { getModelConfigById } from '@/lib/ai/models';
import { isTestEnvironment } from '@/lib/constants'; // Assuming constants holds this
import { codePrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';

export const codeDocumentHandler = createDocumentHandler<'code'>({
  kind: 'code',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    // --- Dynamic Model Selection for Artifact Creation ---
    const internalModelId = 'artifact-model';
    const modelConfig = getModelConfigById(internalModelId);

    if (!modelConfig) {
      console.error(`Model config not found for ID: ${internalModelId}`);
      dataStream.writeData({ type: 'error', content: 'Artifact model configuration not found.' });
      // dataStream doesn't have a close method here, stream likely closes automatically or elsewhere
      return '';
    }

    const providerName = isTestEnvironment ? 'test' : modelConfig.provider;
    const provider = configuredProviders[providerName as keyof typeof configuredProviders];

    if (!provider) {
      console.error(`Provider not found for name: ${providerName}`);
      dataStream.writeData({ type: 'error', content: `Provider '${providerName}' not found.` });
      // dataStream doesn't have a close method here
      return '';
    }

    const providerModelId = isTestEnvironment ? internalModelId : modelConfig.providerModelId;
    const targetModel = provider.languageModel(providerModelId);

    if (!targetModel) {
      console.error(`Language model '${providerModelId}' not found in provider '${providerName}'`);
      dataStream.writeData({ type: 'error', content: `Model '${providerModelId}' not found in provider '${providerName}'.` });
      // dataStream doesn't have a close method here
      return '';
    }
    // --- End Dynamic Model Selection ---

    const { fullStream } = streamObject({
      model: targetModel, // Use the dynamically selected model
      system: codePrompt,
      prompt: title,
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { code } = object;

        if (code) {
          dataStream.writeData({
            type: 'code-delta',
            content: code ?? '',
          });

          draftContent = code;
        }
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    // --- Dynamic Model Selection for Artifact Update ---
    const internalModelId = 'artifact-model';
    const modelConfig = getModelConfigById(internalModelId);

    if (!modelConfig) {
      console.error(`Model config not found for ID: ${internalModelId}`);
      dataStream.writeData({ type: 'error', content: 'Artifact model configuration not found.' });
      // dataStream doesn't have a close method here
      return '';
    }

    const providerName = isTestEnvironment ? 'test' : modelConfig.provider;
    const provider = configuredProviders[providerName as keyof typeof configuredProviders];

    if (!provider) {
      console.error(`Provider not found for name: ${providerName}`);
      dataStream.writeData({ type: 'error', content: `Provider '${providerName}' not found.` });
      // dataStream doesn't have a close method here
      return '';
    }

    const providerModelId = isTestEnvironment ? internalModelId : modelConfig.providerModelId;
    const targetModel = provider.languageModel(providerModelId);

    if (!targetModel) {
      console.error(`Language model '${providerModelId}' not found in provider '${providerName}'`);
      dataStream.writeData({ type: 'error', content: `Model '${providerModelId}' not found in provider '${providerName}'.` });
      // dataStream doesn't have a close method here
      return '';
    }
    // --- End Dynamic Model Selection ---

    const { fullStream } = streamObject({
      model: targetModel, // Use the dynamically selected model
      system: updateDocumentPrompt(document.content, 'code'),
      prompt: description,
      schema: z.object({
        code: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { code } = object;

        if (code) {
          dataStream.writeData({
            type: 'code-delta',
            content: code ?? '',
          });

          draftContent = code;
        }
      }
    }

    return draftContent;
  },
});
