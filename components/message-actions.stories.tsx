import { MessageActions } from './message-actions';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof MessageActions> = {
  component: MessageActions,
  title: 'Chat/MessageActions',
};
export default meta;

export const Default: StoryObj<typeof MessageActions> = {
  args: {},
};