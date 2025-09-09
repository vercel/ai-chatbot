import { SignOutForm } from './sign-out-form';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

const meta: Meta<typeof SignOutForm> = {
  component: SignOutForm,
  title: 'Auth/SignOutForm',
};
export default meta;

export const Default: StoryObj<typeof SignOutForm> = {
  args: {},
};