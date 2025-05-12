import { smoothStream, streamText } from 'ai';
import { configuredProviders } from '@/lib/ai/providers';
import { getModelConfigById } from '@/lib/ai/models';
import { isTestEnvironment } from '@/lib/constants'; // Assuming constants holds this
import { createDocumentHandler } from '@/lib/artifacts/server';
import { updateDocumentPrompt } from '@/lib/ai/prompts';

export const textDocumentHandler = createDocumentHandler<'text'>({
  kind: 'text',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    // --- Dynamic Model Selection for Text Creation ---
    const internalModelId = 'artifact-model';
    const modelConfig = getModelConfigById(internalModelId);

    if (!modelConfig) {
      console.error(`Model config not found for ID: ${internalModelId}`);
      dataStream.writeData({ type: 'error', content: 'Text model configuration not found.' });
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

    const { fullStream } = streamText({
      model: targetModel, // Use the dynamically selected model
      system:
        'Write about the given topic. Markdown is supported. Use headings wherever appropriate.',
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: title,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;

        draftContent += textDelta;

        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    // --- Dynamic Model Selection for Text Update ---
    const internalModelId = 'artifact-model';
    const modelConfig = getModelConfigById(internalModelId);

    if (!modelConfig) {
      console.error(`Model config not found for ID: ${internalModelId}`);
      dataStream.writeData({ type: 'error', content: 'Text model configuration not found.' });
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

    const { fullStream } = streamText({
      model: targetModel, // Use the dynamically selected model
      system: updateDocumentPrompt(document.content, 'text'),
      experimental_transform: smoothStream({ chunking: 'word' }),
      prompt: description,
      // TODO: Review if experimental_providerMetadata needs adjustment for different providers
      // experimental_providerMetadata: {
      //   openai: { // This might need to be dynamic based on the actual provider used
      //     prediction: {
      //       type: 'content',
      //       content: document.content,
      //     },
      //   },
      // },
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'text-delta') {
        const { textDelta } = delta;

        draftContent += textDelta;
        dataStream.writeData({
          type: 'text-delta',
          content: textDelta,
        });
      }
    }

    return draftContent;
  },
});
