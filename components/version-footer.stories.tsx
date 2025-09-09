import { VersionFooter } from './version-footer';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof VersionFooter> = {
  component: VersionFooter,
  title: 'Layout/VersionFooter',
};
export default meta;

export const Default: StoryObj<typeof VersionFooter> = {
  args: {},
};