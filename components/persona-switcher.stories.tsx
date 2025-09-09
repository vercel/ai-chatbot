import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PersonaSwitcher } from './persona-switcher';
import { PersonaProvider } from '@/lib/persona/context';

const meta: Meta<typeof PersonaSwitcher> = {
  title: 'Components/PersonaSwitcher',
  component: PersonaSwitcher,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Persona switcher component for toggling between Owner and Integrator modes.',
      },
    },
  },
  decorators: [
    (Story) => (
      <PersonaProvider>
        <Story />
      </PersonaProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PersonaSwitcher>;

export const Default: Story = {
  args: {},
};

export const InContext: Story = {
  render: () => (
    <div className="p-6 bg-background rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Application Settings</h3>
      <div className="space-y-4">
        <PersonaSwitcher />
        <p className="text-sm text-muted-foreground">
          Switch between Owner and Integrator modes to see different features and UI.
        </p>
      </div>
    </div>
  ),
};