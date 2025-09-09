import { Toolbar } from './toolbar';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Toolbar> = {
  component: Toolbar,
  title: 'UI/Toolbar',
};
export default meta;

export const Default: StoryObj<typeof Toolbar> = {
  args: {},
};