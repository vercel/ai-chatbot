import { SidebarUserNav } from './sidebar-user-nav';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof SidebarUserNav> = {
  component: SidebarUserNav,
  title: 'Navigation/SidebarUserNav',
};
export default meta;

export const Default: StoryObj<typeof SidebarUserNav> = {
  args: {},
};