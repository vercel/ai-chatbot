import { SubmitButton } from './submit-button';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof SubmitButton> = {
  component: SubmitButton,
  title: 'UI/SubmitButton',
  argTypes: {
    isLoading: {
      control: 'boolean',
      description: 'Shows loading state',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button',
    },
  },
};
export default meta;

export const Default: StoryObj<typeof SubmitButton> = {
  args: {
    children: 'Submit',
  },
};

export const Loading: StoryObj<typeof SubmitButton> = {
  args: {
    children: 'Submitting...',
    isLoading: true,
  },
};

export const Disabled: StoryObj<typeof SubmitButton> = {
  args: {
    children: 'Submit',
    disabled: true,
  },
};