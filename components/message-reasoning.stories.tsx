import { MessageReasoning } from './message-reasoning';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof MessageReasoning> = {
  component: MessageReasoning,
  title: 'Chat/MessageReasoning',
};
export default meta;

export const Default: StoryObj<typeof MessageReasoning> = {
  args: {},
};