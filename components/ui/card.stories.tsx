import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
import { Button } from './button';
import { Badge } from './badge';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Card component with YSH-specific variants for solar energy content.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'savings', 'solar-panel', 'highlight'],
      description: 'Card style variant',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Default Card</CardTitle>
        <CardDescription>A standard card component</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Savings: Story = {
  args: {
    variant: 'savings',
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💰 Energy Savings
          <Badge variant="secondary">Popular</Badge>
        </CardTitle>
        <CardDescription>Calculate your potential savings with solar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Monthly Savings:</span>
            <span className="font-semibold text-green-600">$127</span>
          </div>
          <div className="flex justify-between">
            <span>Yearly Savings:</span>
            <span className="font-semibold text-green-600">$1,524</span>
          </div>
          <div className="flex justify-between">
            <span>Payback Period:</span>
            <span className="font-semibold">7.2 years</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="solar">Get Detailed Quote</Button>
      </CardFooter>
    </Card>
  ),
};

export const SolarPanel: Story = {
  args: {
    variant: 'solar-panel',
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ☀️ Solar Panel System
        </CardTitle>
        <CardDescription>Premium solar installation package</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Capacity</div>
              <div className="text-muted-foreground">8.5 kW</div>
            </div>
            <div>
              <div className="font-medium">Efficiency</div>
              <div className="text-muted-foreground">22.5%</div>
            </div>
            <div>
              <div className="font-medium">Warranty</div>
              <div className="text-muted-foreground">25 years</div>
            </div>
            <div>
              <div className="font-medium">ROI</div>
              <div className="text-muted-foreground">15-20%</div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="calculator">Calculate for My Home</Button>
      </CardFooter>
    </Card>
  ),
};

export const Highlight: Story = {
  args: {
    variant: 'highlight',
  },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>🌱 Environmental Impact</CardTitle>
        <CardDescription>Your contribution to a cleaner planet</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>CO₂ Reduced:</span>
            <span className="font-semibold text-green-600">2.3 tons/year</span>
          </div>
          <div className="flex justify-between">
            <span>Trees Equivalent:</span>
            <span className="font-semibold text-green-600">23 trees</span>
          </div>
          <div className="flex justify-between">
            <span>Clean Energy:</span>
            <span className="font-semibold text-green-600">12,500 kWh</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="eco">Learn More</Button>
      </CardFooter>
    </Card>
  ),
};

export const SimpleContent: Story = {
  render: () => (
    <Card>
      <CardContent className="pt-6">
        <p>Simple card with just content, no header or footer.</p>
      </CardContent>
    </Card>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Card className="w-80">
      <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600 rounded-t-lg flex items-center justify-center text-white font-semibold">
        Solar Panel Image
      </div>
      <CardHeader>
        <CardTitle>Solar Installation</CardTitle>
        <CardDescription>Professional solar panel installation services</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Get your home powered by clean, renewable energy.</p>
      </CardContent>
      <CardFooter>
        <Button variant="solar" className="w-full">Get Started</Button>
      </CardFooter>
    </Card>
  ),
};