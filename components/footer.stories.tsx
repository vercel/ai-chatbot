import { Footer } from './footer';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Footer> = {
  component: Footer,
  title: 'Layout/Footer',
};
export default meta;

export const Default: StoryObj<typeof Footer> = {
  args: {},
};