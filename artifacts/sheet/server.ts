import { configuredProviders } from '@/lib/ai/providers';
import { getModelConfigById } from '@/lib/ai/models';
import { isTestEnvironment } from '@/lib/constants'; // Assuming constants holds this
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { streamObject } from 'ai';
import { z } from 'zod';

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    // --- Dynamic Model Selection for Sheet Creation ---
    const internalModelId = 'artifact-model';
    const modelConfig = getModelConfigById(internalModelId);

    if (!modelConfig) {
      console.error(`Model config not found for ID: ${internalModelId}`);
      dataStream.writeData({ type: 'error', content: 'Sheet model configuration not found.' });
      return '';
    }

    const providerName = isTestEnvironment ? 'test' : modelConfig.provider;
    const provider = configuredProviders[providerName as keyof typeof configuredProviders];

    if (!provider) {
      console.error(`Provider not found for name: ${providerName}`);
      dataStream.writeData({ type: 'error', content: `Provider '${providerName}' not found.` });
      return '';
    }

    const providerModelId = isTestEnvironment ? internalModelId : modelConfig.providerModelId;
    const targetModel = provider.languageModel(providerModelId);

    if (!targetModel) {
      console.error(`Language model '${providerModelId}' not found in provider '${providerName}'`);
      dataStream.writeData({ type: 'error', content: `Model '${providerModelId}' not found in provider '${providerName}'.` });
      return '';
    }
    // --- End Dynamic Model Selection ---

    const { fullStream } = streamObject({
      model: targetModel, // Use the dynamically selected model
      system: sheetPrompt,
      prompt: title,
      schema: z.object({
        csv: z.string().describe('CSV data'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { csv } = object;

        if (csv) {
          dataStream.writeData({
            type: 'sheet-delta',
            content: csv,
          });

          draftContent = csv;
        }
      }
    }

    // This seems redundant as draftContent already holds the final CSV?
    // dataStream.writeData({
    //   type: 'sheet-delta',
    //   content: draftContent,
    // });

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    // --- Dynamic Model Selection for Sheet Update ---
    const internalModelId = 'artifact-model';
    const modelConfig = getModelConfigById(internalModelId);

    if (!modelConfig) {
      console.error(`Model config not found for ID: ${internalModelId}`);
      dataStream.writeData({ type: 'error', content: 'Sheet model configuration not found.' });
      return '';
    }

    const providerName = isTestEnvironment ? 'test' : modelConfig.provider;
    const provider = configuredProviders[providerName as keyof typeof configuredProviders];

    if (!provider) {
      console.error(`Provider not found for name: ${providerName}`);
      dataStream.writeData({ type: 'error', content: `Provider '${providerName}' not found.` });
      return '';
    }

    const providerModelId = isTestEnvironment ? internalModelId : modelConfig.providerModelId;
    const targetModel = provider.languageModel(providerModelId);

    if (!targetModel) {
      console.error(`Language model '${providerModelId}' not found in provider '${providerName}'`);
      dataStream.writeData({ type: 'error', content: `Model '${providerModelId}' not found in provider '${providerName}'.` });
      return '';
    }
    // --- End Dynamic Model Selection ---

    const { fullStream } = streamObject({
      model: targetModel, // Use the dynamically selected model
      system: updateDocumentPrompt(document.content, 'sheet'),
      prompt: description,
      schema: z.object({
        csv: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { csv } = object;

        if (csv) {
          dataStream.writeData({
            type: 'sheet-delta',
            content: csv,
          });

          draftContent = csv;
        }
      }
    }

    return draftContent;
  },
});
