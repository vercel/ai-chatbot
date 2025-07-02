import { myProvider } from '@/lib/ai/providers';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { experimental_generateImage } from 'ai';

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ title, streamWriter, toolCallId }) => {
    let draftContent = '';

    const { image } = await experimental_generateImage({
      model: myProvider.imageModel('small-model'),
      prompt: title,
      n: 1,
    });

    draftContent = image.base64;

    streamWriter.write({
      id: toolCallId,
      type: 'data-document',
      data: {
        content: image.base64,
      },
    });

    return draftContent;
  },
  onUpdateDocument: async ({ description, streamWriter, toolCallId }) => {
    let draftContent = '';

    const { image } = await experimental_generateImage({
      model: myProvider.imageModel('small-model'),
      prompt: description,
      n: 1,
    });

    draftContent = image.base64;

    streamWriter.write({
      id: toolCallId,
      type: 'data-document',
      data: {
        content: image.base64,
      },
    });

    return draftContent;
  },
});
