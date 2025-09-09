import { SidebarToggle } from './sidebar-toggle';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof SidebarToggle> = {
  component: SidebarToggle,
  title: 'Navigation/SidebarToggle',
};
export default meta;

export const Default: StoryObj<typeof SidebarToggle> = {
  args: {},
};