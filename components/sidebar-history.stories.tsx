import { SidebarHistory } from './sidebar-history';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof SidebarHistory> = {
  component: SidebarHistory,
  title: 'Navigation/SidebarHistory',
};
export default meta;

export const Default: StoryObj<typeof SidebarHistory> = {
  args: {},
};