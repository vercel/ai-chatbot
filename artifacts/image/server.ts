import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { experimental_generateImage } from 'ai';

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ title, dataStream, instructions }) => {
    let draftContent = '';

    const finalPrompt = `${title}${instructions ? `. Style/Instructions: ${instructions}` : ''}`;

    const { image } = await experimental_generateImage({
      model: myProvider.imageModel('gpt-image-1'),
      prompt: finalPrompt,
      n: 1,
    });

    draftContent = image.base64;

    dataStream.writeData({
      type: 'image-delta',
      content: image.base64,
    });

    return draftContent;
  },
  onUpdateDocument: async ({ description, dataStream, instructions }) => {
    let draftContent = '';

    const finalPrompt = `${description}${instructions ? `. Style/Instructions for update: ${instructions}` : ''}`;

    console.log(`[Image Update] Final Prompt: "${finalPrompt}"`);

    const { image } = await experimental_generateImage({
      model: myProvider.imageModel('gpt-image-1'),
      prompt: finalPrompt,
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
