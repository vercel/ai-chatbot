import { MessageEditor } from './message-editor';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof MessageEditor> = {
  component: MessageEditor,
  title: 'Chat/MessageEditor',
};
export default meta;

export const Default: StoryObj<typeof MessageEditor> = {
  args: {},
};