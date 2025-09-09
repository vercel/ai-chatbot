import { ProviderSelector } from './provider-selector';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof ProviderSelector> = {
  component: ProviderSelector,
  title: 'UI/ProviderSelector',
};
export default meta;

export const Default: StoryObj<typeof ProviderSelector> = {
  args: {},
};