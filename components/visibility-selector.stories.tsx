import { VisibilitySelector } from './visibility-selector';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof VisibilitySelector> = {
  component: VisibilitySelector,
  title: 'UI/VisibilitySelector',
};
export default meta;

export const Default: StoryObj<typeof VisibilitySelector> = {
  args: {},
};