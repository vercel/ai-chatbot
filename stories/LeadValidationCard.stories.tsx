import type { Meta, StoryObj } from "@storybook/react";
import LeadValidationCard from "@/components/lead/LeadValidationCard";
import type { LeadValidationResult } from "@/lib/lead/types";

const meta: Meta<typeof LeadValidationCard> = {
  title: "Lead/LeadValidationCard",
  component: LeadValidationCard,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "Card component that displays lead validation results with status, reasons, normalized data, and next steps.",
      },
    },
  },
  argTypes: {
    className: {
      control: { type: "text" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof LeadValidationCard>;

const baseResult: LeadValidationResult = {
  isValidLead: true,
  status: "approved",
  reasons: [],
  normalized: {
    email: "joao.silva@example.com",
    phone: "+5511999999999",
    address: "Rua das Flores, 123 - São Paulo - SP",
    uf: "SP",
  },
  next: {
    primaryCta: { label: "Prosseguir para Análise", href: "/journey/analysis" },
    secondaryCta: { label: "Voltar para Jornada", href: "/journey" },
  },
  confidence: 0.9,
};

export const Approved: Story = {
  args: {
    result: baseResult,
  },
};

export const Incomplete: Story = {
  args: {
    result: {
      ...baseResult,
      isValidLead: false,
      status: "incomplete",
      reasons: [
        "E-mail inválido",
        "Telefone obrigatório quando endereço não informado",
        "Endereço deve conter UF válida",
      ],
      normalized: {
        email: undefined,
        phone: "+5511999999999",
        address: "Rua sem UF",
        uf: undefined,
      },
      next: {
        primaryCta: { label: "Corrigir informações", href: "#intent-form" },
        secondaryCta: { label: "Voltar para Jornada", href: "/journey" },
      },
      confidence: 0.4,
    },
  },
};

export const UnsupportedRegion: Story = {
  args: {
    result: {
      ...baseResult,
      isValidLead: false,
      status: "unsupported_region",
      reasons: [
        "Região não suportada: CE",
        "Atualmente atendemos apenas SP, RJ, MG, PR, SC e RS",
      ],
      normalized: {
        email: "cliente@exemplo.com",
        phone: "+5585999999999",
        address: "Av. Fortaleza, 456 - Fortaleza - CE",
        uf: "CE",
      },
      next: {
        primaryCta: { label: "Falar com Atendimento", href: "/support" },
        secondaryCta: { label: "Voltar para Jornada", href: "/journey" },
      },
      confidence: 0.6,
    },
  },
};

export const MinimalData: Story = {
  args: {
    result: {
      ...baseResult,
      normalized: {
        email: "minimal@example.com",
        phone: "+5511987654321",
        address: undefined,
        uf: undefined,
      },
      confidence: 0.7,
    },
  },
};

export const WithCustomClassName: Story = {
  args: {
    result: baseResult,
    className: "max-w-md mx-auto shadow-lg",
  },
};

export const LowConfidence: Story = {
  args: {
    result: {
      ...baseResult,
      confidence: 0.3,
      reasons: ["Dados incompletos", "Confiança baixa na validação"],
    },
  },
};

export const HighConfidence: Story = {
  args: {
    result: {
      ...baseResult,
      confidence: 1.0,
      reasons: [],
    },
  },
};