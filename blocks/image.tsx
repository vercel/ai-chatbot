import { Block } from '@/components/create-block';
import { ImageEditor } from '@/components/image-editor';

export const imageBlock = new Block({
  kind: 'image',
  description: 'Useful for image generation',
  content: ImageEditor,
  actions: [
    {
      name: 'copy-to-clipboard',
      description: 'Copy image to clipboard',
    },
  ],
  toolbar: [],
});
