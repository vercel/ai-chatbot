import { Messages } from './messages';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof Messages> = {
  component: Messages,
  title: 'Chat/Messages',
};
export default meta;

export const Default: StoryObj<typeof Messages> = {
  args: {},
};