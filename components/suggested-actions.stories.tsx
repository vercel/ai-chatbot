import { SuggestedActions } from './suggested-actions';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SuggestedActions> = {
  component: SuggestedActions,
  title: 'UI/SuggestedActions',
};
export default meta;

export const Default: StoryObj<typeof SuggestedActions> = {
  args: {
    actions: [
      { label: 'Analyze Roof', action: () => console.log('Analyze') },
      { label: 'Calculate Savings', action: () => console.log('Calculate') },
      { label: 'Get Quote', action: () => console.log('Quote') },
    ],
  },
};