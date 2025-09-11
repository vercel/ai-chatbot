import type { Meta, StoryObj } from "@storybook/react";
import IntentInput from "@/components/intent/IntentInput";
import type { LeadValidationResult } from "@/lib/lead/types";

const meta: Meta<typeof IntentInput> = {
  title: "Intent/IntentInput",
  component: IntentInput,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Generic, parametric form component for collecting intent data from users.",
      },
    },
  },
  argTypes: {
    layout: {
      control: { type: "select" },
      options: ["compact", "wide"],
    },
    submitMode: {
      control: { type: "select" },
      options: ["serverAction", "api"],
    },
    onValidated: { action: "validated" },
  },
};

export default meta;
type Story = StoryObj<typeof IntentInput>;

export const Default: Story = {
  args: {
    layout: "compact",
    submitMode: "serverAction",
    onValidated: (result: LeadValidationResult) => {
      console.log("Validation result:", result);
    },
  },
};

export const WideLayout: Story = {
  args: {
    ...Default.args,
    layout: "wide",
  },
};

export const WithDefaultValues: Story = {
  args: {
    ...Default.args,
    defaultValues: {
      name: "João Silva",
      email: "joao@example.com",
      phone: "(11) 99999-9999",
      address: "Rua Teste, 123 - São Paulo - SP",
      persona: "owner",
      goal: "viability",
      notes: "Cliente interessado em sistema de 5kWp",
    },
  },
};

export const CustomFields: Story = {
  args: {
    ...Default.args,
    fields: [
      { name: "name", label: "Nome Completo", required: true, type: "text" },
      { name: "email", label: "E-mail Corporativo", type: "email" },
      { name: "phone", label: "Telefone de Contato", type: "tel" },
      { name: "persona", label: "Tipo de Cliente", type: "select", options: [
        { label: "Pessoa Física", value: "owner" },
        { label: "Pessoa Jurídica", value: "integrator" },
      ]},
      { name: "goal", label: "Interesse", type: "select", options: [
        { label: "Viabilidade Técnica", value: "viability" },
        { label: "Orçamento", value: "quote" },
        { label: "Suporte", value: "support" },
      ]},
      { name: "notes", label: "Observações", type: "textarea", placeholder: "Detalhes adicionais..." },
    ],
  },
};

export const ApiMode: Story = {
  args: {
    ...Default.args,
    submitMode: "api",
  },
};

export const WithCustomClassName: Story = {
  args: {
    ...Default.args,
    className: "max-w-2xl mx-auto",
  },
};