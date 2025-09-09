import { AuthForm } from './auth-form';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof AuthForm> = {
  component: AuthForm,
  title: 'Auth/AuthForm',
};
export default meta;

export const Default: StoryObj<typeof AuthForm> = {
  args: {},
};