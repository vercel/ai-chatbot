import { Suggestion } from './suggestion';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof Suggestion> = {
  component: Suggestion,
  title: 'UI/Suggestion',
};
export default meta;

export const Default: StoryObj<typeof Suggestion> = {
  args: {
    suggestion: 'Try uploading a photo of your roof for better analysis',
  },
};