import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from './input';
import { Label } from './label';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Input component for text entry in forms and search fields.',
      },
    },
  },
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
      description: 'Input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    value: {
      control: 'text',
      description: 'Input value',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your text here',
  },
};

export const Email: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
  },
};

export const Password: Story = {
  args: {
    type: 'password',
    placeholder: 'Enter your password',
  },
};

export const NumberInput: Story = {
  args: {
    type: 'number',
    placeholder: 'Enter a number',
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const WithValue: Story = {
  args: {
    value: 'Pre-filled value',
    placeholder: 'This will be replaced',
  },
};

export const WithLabel: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="input-example">Input Label</Label>
      <Input id="input-example" {...args} />
    </div>
  ),
  args: {
    placeholder: 'Input with label',
  },
};

export const SolarSpecific: Story = {
  render: (args) => (
    <div className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="address">Installation Address</Label>
        <Input id="address" placeholder="123 Solar Street, Sunny City" {...args} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="budget">Monthly Budget ($)</Label>
        <Input id="budget" type="number" placeholder="200" {...args} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="panels">Number of Panels</Label>
        <Input id="panels" type="number" placeholder="20" {...args} />
      </div>
    </div>
  ),
};