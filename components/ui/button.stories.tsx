import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Button } from './button';
import { Sun, Calculator, Leaf } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Versatile button component with YSH-specific variants for solar energy applications.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'solar', 'eco', 'calculator'],
      description: 'Button style variant',
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'hero'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Default Button',
  },
};

export const Solar: Story = {
  args: {
    variant: 'solar',
    children: 'Get Solar Quote',
    size: 'hero',
  },
};

export const Eco: Story = {
  args: {
    variant: 'eco',
    children: 'Go Green',
  },
  render: (args) => (
    <Button {...args}>
      <Leaf className="w-4 h-4" />
      {args.children}
    </Button>
  ),
};

export const CalculatorButton: Story = {
  args: {
    variant: 'calculator',
    children: 'Calculate Savings',
  },
  render: (args) => (
    <Button {...args}>
      <Calculator className="w-4 h-4" />
      {args.children}
    </Button>
  ),
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete Project',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Action',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="hero">Hero</Button>
    </div>
  ),
};

export const IconButton: Story = {
  args: {
    size: 'icon',
    children: <Sun className="w-4 h-4" />,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled Button',
  },
};

export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button>
        <Sun className="w-4 h-4" />
        Solar
      </Button>
      <Button variant="outline">
        Calculator
        <Calculator className="w-4 h-4" />
      </Button>
      <Button variant="eco">
        <Leaf className="w-4 h-4" />
        Eco Friendly
      </Button>
    </div>
  ),
};