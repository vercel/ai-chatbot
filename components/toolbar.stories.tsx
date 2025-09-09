import { Toolbar } from './toolbar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof Toolbar> = {
  component: Toolbar,
  title: 'UI/Toolbar',
};
export default meta;

export const Default: StoryObj<typeof Toolbar> = {
  args: {},
};