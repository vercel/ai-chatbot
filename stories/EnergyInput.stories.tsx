import type { Meta, StoryObj } from '@storybook/react';import type { Meta, StoryObj } from '@storybook/react';import type { Meta, StoryObj } from "@storybook/react";

import { EnergyInputForm } from '@/components/analysis/EnergyInput';

import { EnergyInputForm } from '@/components/analysis/EnergyInput';import { EnergyInputForm } from "@/components/analysis/EnergyInput";

const meta: Meta<typeof EnergyInputForm> = {

  title: 'Analysis/EnergyInput',import { usePersona } from "@/lib/persona/context";

  component: EnergyInputForm,

  parameters: {const meta: Meta<typeof EnergyInputForm> = {

    layout: 'centered',

    docs: {  title: 'Analysis/EnergyInput',// Mock the persona context

      description: {

        component: 'Form component for collecting energy consumption data from users.',  component: EnergyInputForm,const mockUsePersona = () => ({ persona: "owner" });

      },

    },  parameters: {

  },

  tags: ['autodocs'],    layout: 'centered',// Mock React Hook Form

};

    docs: {vi.mock("react-hook-form", () => ({

export default meta;

type Story = StoryObj<typeof meta>;      description: {  useForm: () => ({



export const Default: Story = {        component: 'Form component for collecting energy consumption data from users.',    register: vi.fn(),

  args: {

    onSubmit: (data) => console.log('Submitted:', data),      },    handleSubmit: vi.fn(),

    isLoading: false,

  },    },    formState: { errors: {} },

};
  },    watch: vi.fn(),

  tags: ['autodocs'],    setValue: vi.fn(),

  decorators: [  }),

    (Story) => (}));

      <div className="w-full max-w-2xl p-6">

        <Story />const meta: Meta<typeof EnergyInputForm> = {

      </div>  title: "Analysis/EnergyInput",

    ),  component: EnergyInputForm,

  ],  parameters: {

};    layout: "centered",

    docs: {

export default meta;      description: {

type Story = StoryObj<typeof meta>;        component:

          "Form component for collecting energy consumption data from users.",

export const OwnerPersona: Story = {      },

  args: {    },

    onSubmit: (data) => console.log('Owner submitted:', data),  },

    isLoading: false,  tags: ["autodocs"],

  },  decorators: [

  parameters: {    (Story) => (

    docs: {      <div className="w-full max-w-2xl p-6">

      description: {        <Story />

        story: 'Simplified form for homeowner persona with basic energy input fields.',      </div>

      },    ),

    },  ],

  },};

};

export default meta;

export const LoadingState: Story = {type Story = StoryObj<typeof meta>;

  args: {

    onSubmit: (data) => console.log('Loading submitted:', data),export const OwnerPersona: Story = {

    isLoading: true,  args: {

  },    onSubmit: (data) => console.log("Owner submitted:", data),

  parameters: {    isLoading: false,

    docs: {  },

      description: {  parameters: {

        story: 'Form in loading state during analysis processing.',    docs: {

      },      description: {

    },        story:

  },          "Simplified form for homeowner persona with basic energy input fields.",

};      },
    },
  },
};

export const IntegratorPersona: Story = {
  args: {
    onSubmit: (data) => console.log("Integrator submitted:", data),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Technical form for integrator persona with advanced options.",
      },
    },
  },
  decorators: [
    (Story) => {
      // Mock integrator persona
      const originalUsePersona = usePersona;
      usePersona.mockReturnValue({ persona: "integrator" });

      const result = <Story />;

      // Restore original
      usePersona.mockReturnValue({ persona: "owner" });

      return result;
    },
  ],
};

export const LoadingState: Story = {
  args: {
    onSubmit: (data) => console.log("Loading submitted:", data),
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Form in loading state during analysis processing.",
      },
    },
  },
};

export const WithValidationErrors: Story = {
  args: {
    onSubmit: (data) => console.log("Error submitted:", data),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Form showing validation errors for required fields.",
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
