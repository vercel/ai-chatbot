import { ImageEditor } from './image-editor';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof ImageEditor> = {
  component: ImageEditor,
  title: 'Editors/ImageEditor',
};
export default meta;

export const Default: StoryObj<typeof ImageEditor> = {
  args: {},
};
