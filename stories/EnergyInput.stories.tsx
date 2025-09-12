import type { Meta, StoryObj } from "@storybook/react";

import { EnergyInputForm } from "@/components/analysis/EnergyInput";

const meta: Meta<typeof EnergyInputForm> = {
  title: "Analysis/EnergyInput",
  component: EnergyInputForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Form component for collecting energy consumption data from users.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: (data) => console.log("Submitted:", data),
    isLoading: false,
  },
};

export const OwnerPersona: Story = {
  args: {
    onSubmit: (data) => console.log("Owner submitted:", data),
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Simplified form for homeowner persona with basic energy input fields.",
      },
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
        <Story />
        <div className="mt-4 text-red-600 text-sm">
          Consumo mensal é obrigatório
        </div>
      </div>
    ),
  ],
};
