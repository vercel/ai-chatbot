import { Weather } from './weather';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Weather> = {
  component: Weather,
  title: 'UI/Weather',
  argTypes: {
    location: {
      control: 'text',
      description: 'Weather location',
    },
  },
};
export default meta;

export const Default: StoryObj<typeof Weather> = {
  args: {
    location: 'São Paulo, BR',
  },
};

export const Loading: StoryObj<typeof Weather> = {
  args: {
    location: 'Loading...',
  },
};