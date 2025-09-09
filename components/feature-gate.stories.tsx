import { FeatureGate } from './feature-gate';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof FeatureGate> = {
  component: FeatureGate,
  title: 'UI/FeatureGate',
  argTypes: {
    permission: {
      control: 'text',
      description: 'Permission required to show content',
    },
    flag: {
      control: 'text',
      description: 'Feature flag required to show content',
    },
  },
};
export default meta;

export const Default: StoryObj<typeof FeatureGate> = {
  args: {
    children: <div>Advanced Analytics Content</div>,
  },
};

export const WithPermission: StoryObj<typeof FeatureGate> = {
  args: {
    permission: 'advanced-analytics',
    children: <div>Advanced Analytics Content</div>,
  },
};

export const WithFlag: StoryObj<typeof FeatureGate> = {
  args: {
    flag: 'premium-feature',
    children: <div>Premium Feature</div>,
  },
};