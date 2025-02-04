import { myProvider } from '@/lib/ai/models';
import { createDocumentHandler } from '@/lib/blocks/server';
import { saveDocument } from '@/lib/db/queries';
import { experimental_generateImage } from 'ai';

export const imageDocumentHandler = createDocumentHandler<'image'>({
  kind: 'image',
  onCreateDocument: async ({ id, title, dataStream, session }) => {
    let draftContent = '';

    const { image } = await experimental_generateImage({
      model: myProvider.imageModel('small-model'),
      prompt: title,
      n: 1,
    });

    draftContent = image.base64;

    dataStream.writeData({
      type: 'image-delta',
      content: image.base64,
    });

    if (session?.user?.id) {
      await saveDocument({
        id,
        title,
        kind: 'image',
        content: draftContent,
        userId: session.user.id,
      });
    }

    return draftContent;
  },
  onUpdateDocument: async ({ description, dataStream }) => {
    let draftContent = '';

    const { image } = await experimental_generateImage({
      model: myProvider.imageModel('image-model'),
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
