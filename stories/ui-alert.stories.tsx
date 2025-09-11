import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
};
export default meta;

type Story = StoryObj<typeof Alert>;

export const Solar: Story = {
  render: () => (
    <Alert variant="solar">
      <AlertTitle>Alerta Solar</AlertTitle>
      <AlertDescription>Energia solar em destaque.</AlertDescription>
    </Alert>
  ),
};

export const Eco: Story = {
  render: () => (
    <Alert variant="eco">
      <AlertTitle>Alerta Eco</AlertTitle>
      <AlertDescription>Configurações ecológicas ativas.</AlertDescription>
    </Alert>
  ),
};
