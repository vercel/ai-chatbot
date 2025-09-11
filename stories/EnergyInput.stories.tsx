import type { Meta, StoryObj } from '@storybook/react';
import { EnergyInputForm } from '@/components/analysis/EnergyInput';
import { usePersona } from '@/lib/persona/context';

// Mock the persona context
const mockUsePersona = () => ({ persona: 'owner' });

// Mock React Hook Form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: vi.fn(),
    formState: { errors: {} },
    watch: vi.fn(),
    setValue: vi.fn(),
  }),
}));

const meta: Meta<typeof EnergyInputForm> = {
  title: 'Analysis/EnergyInput',
  component: EnergyInputForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Form component for collecting energy consumption data from users.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-6">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const OwnerPersona: Story = {
  args: {
    onSubmit: (data) => console.log('Owner submitted:', data),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Simplified form for homeowner persona with basic energy input fields.',
      },
    },
  },
};

export const IntegratorPersona: Story = {
  args: {
    onSubmit: (data) => console.log('Integrator submitted:', data),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Technical form for integrator persona with advanced options.',
      },
    },
  },
  decorators: [
    (Story) => {
      // Mock integrator persona
      const originalUsePersona = usePersona;
      usePersona.mockReturnValue({ persona: 'integrator' });

      const result = <Story />;

      // Restore original
      usePersona.mockReturnValue({ persona: 'owner' });

      return result;
    },
  ],
};

export const LoadingState: Story = {
  args: {
    onSubmit: (data) => console.log('Loading submitted:', data),
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Form in loading state during analysis processing.',
      },
    },
  },
};

export const WithValidationErrors: Story = {
  args: {
    onSubmit: (data) => console.log('Error submitted:', data),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Form showing validation errors for required fields.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl p-6">
        {/* Simulate form with errors */}
        <Story />
        <div className="mt-4 text-red-600 text-sm">
          Consumo mensal é obrigatório
        </div>
      </div>
    ),
  ],
};