import { configuredProviders } from '@/lib/ai/providers';
import { isTestEnvironment } from '@/lib/constants'; // Assuming constants holds this
import { createDocumentHandler } from '@/lib/artifacts/server';
import { experimental_generateImage } from 'ai';

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = '';

    // --- Dynamic Model Selection for Image Creation ---
    // Note: Using hardcoded provider 'xai' and model 'grok-2-image' as it's the only one configured.
    // TODO: Consider making image model selection configurable via models.ts if needed.
    const providerName = isTestEnvironment ? 'test' : 'xai';
    const provider = configuredProviders[providerName as keyof typeof configuredProviders];

    if (!provider) {
      console.error(`Provider not found for name: ${providerName}`);
      dataStream.writeData({ type: 'error', content: `Image provider '${providerName}' not found.` });
      return ''; // Cannot proceed
    }

    const imageModelId = 'grok-2-image'; // Hardcoded - only one configured
    const targetModel = provider.imageModel(imageModelId);

    if (!targetModel) {
      console.error(`Image model '${imageModelId}' not found in provider '${providerName}'`);
      // Note: Test provider currently has no image models, this will fail in test env.
      dataStream.writeData({ type: 'error', content: `Image model '${imageModelId}' not found in provider '${providerName}'.` });
      return ''; // Cannot proceed
    }
    // --- End Dynamic Model Selection ---

    const { image } = await experimental_generateImage({
      model: targetModel, // Use the dynamically selected model
      prompt: title,
      n: 1,
    });

    draftContent = image.base64;

    dataStream.writeData({
      type: 'image-delta',
      content: image.base64,
    });

    return draftContent;
  },
  onUpdateDocument: async ({ description, dataStream }) => {
    let draftContent = '';

    // --- Dynamic Model Selection for Image Update ---
    // Repeating the same logic as onCreateDocument
    const providerName = isTestEnvironment ? 'test' : 'xai';
    const provider = configuredProviders[providerName as keyof typeof configuredProviders];

    if (!provider) {
      console.error(`Provider not found for name: ${providerName}`);
      dataStream.writeData({ type: 'error', content: `Image provider '${providerName}' not found.` });
      return '';
    }

    const imageModelId = 'grok-2-image';
    const targetModel = provider.imageModel(imageModelId);

    if (!targetModel) {
      console.error(`Image model '${imageModelId}' not found in provider '${providerName}'`);
      dataStream.writeData({ type: 'error', content: `Image model '${imageModelId}' not found in provider '${providerName}'.` });
      return '';
    }
    // --- End Dynamic Model Selection ---

    const { image } = await experimental_generateImage({
      model: targetModel, // Use the dynamically selected model
      prompt: description,
      n: 1,
    });

    draftContent = image.base64;

    dataStream.writeData({
      type: 'image-delta',
      content: image.base64,
    });

    return draftContent;
  },
});
