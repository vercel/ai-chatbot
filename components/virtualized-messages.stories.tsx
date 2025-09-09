import { VirtualizedMessages } from './virtualized-messages';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof VirtualizedMessages> = {
  component: VirtualizedMessages,
  title: 'Chat/VirtualizedMessages',
};
export default meta;

export const Default: StoryObj<typeof VirtualizedMessages> = {
  args: {},
};