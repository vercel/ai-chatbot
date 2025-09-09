import { AppSidebar } from './app-sidebar';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof AppSidebar> = {
  component: AppSidebar,
  title: 'Layout/AppSidebar',
};
export default meta;

export const Default: StoryObj<typeof AppSidebar> = {
  args: {},
};
