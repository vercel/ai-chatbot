import { PreviewAttachment } from './preview-attachment';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof PreviewAttachment> = {
  component: PreviewAttachment,
  title: 'UI/PreviewAttachment',
  argTypes: {
    type: {
      control: 'select',
      options: ['image', 'document', 'video'],
      description: 'Attachment type',
    },
  },
};
export default meta;

export const Image: StoryObj<typeof PreviewAttachment> = {
  args: {
    type: 'image',
    url: 'https://via.placeholder.com/300x200',
  },
};

export const Document: StoryObj<typeof PreviewAttachment> = {
  args: {
    type: 'document',
    url: 'https://example.com/document.pdf',
  },
};