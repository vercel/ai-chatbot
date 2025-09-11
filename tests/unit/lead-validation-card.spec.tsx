import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import LeadValidationCard from "@/components/lead/LeadValidationCard";
import type { LeadValidationResult } from "@/lib/lead/types";

describe("LeadValidationCard", () => {
  const baseResult: LeadValidationResult = {
    isValidLead: true,
    status: "approved",
    reasons: [],
    normalized: {},
    next: { primaryCta: { label: "Continue", href: "/next" } },
    confidence: 0.8,
  };

  it("renders approved status correctly", () => {
    render(<LeadValidationCard result={baseResult} />);

    expect(screen.getByText("Validação de Lead")).toBeInTheDocument();
    expect(screen.getByText("Aprovado")).toBeInTheDocument();
    expect(screen.getByTestId("lead-status")).toHaveTextContent("Status: Aprovado");
  });

  it("renders incomplete status correctly", () => {
    const result: LeadValidationResult = {
      ...baseResult,
      status: "incomplete",
      reasons: ["E-mail inválido", "Telefone obrigatório"],
    };

    render(<LeadValidationCard result={result} />);

    expect(screen.getByText("Incompleto")).toBeInTheDocument();
    expect(screen.getByText("E-mail inválido")).toBeInTheDocument();
    expect(screen.getByText("Telefone obrigatório")).toBeInTheDocument();
  });

  it("renders unsupported region status correctly", () => {
    const result: LeadValidationResult = {
      ...baseResult,
      status: "unsupported_region",
      reasons: ["Região não suportada: CE"],
    };

    render(<LeadValidationCard result={result} />);

    expect(screen.getByText("Fora de cobertura")).toBeInTheDocument();
    expect(screen.getByText("Região não suportada: CE")).toBeInTheDocument();
  });

  it("displays normalized data when available", () => {
    const result: LeadValidationResult = {
      ...baseResult,
      normalized: {
        email: "user@example.com",
        phone: "+5511999999999",
        address: "Rua Teste, 123 - São Paulo - SP",
        uf: "SP",
      },
    };

    render(<LeadValidationCard result={result} />);

    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("+5511999999999")).toBeInTheDocument();
    expect(screen.getByText("Rua Teste, 123 - São Paulo - SP")).toBeInTheDocument();
    expect(screen.getByText("SP")).toBeInTheDocument();
  });

  it("shows primary CTA button", () => {
    const result: LeadValidationResult = {
      ...baseResult,
      next: { primaryCta: { label: "Prosseguir para Análise", href: "/analysis" } },
    };

    render(<LeadValidationCard result={result} />);

    const primaryButton = screen.getByRole("link", { name: "Prosseguir para Análise" });
    expect(primaryButton).toHaveAttribute("href", "/analysis");
  });

  it("shows secondary CTA button when available", () => {
    const result: LeadValidationResult = {
      ...baseResult,
      next: {
        primaryCta: { label: "Prosseguir", href: "/next" },
        secondaryCta: { label: "Voltar", href: "/back" },
      },
    };

    render(<LeadValidationCard result={result} />);

    expect(screen.getByRole("link", { name: "Prosseguir" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar" })).toBeInTheDocument();
  });

  it("does not show secondary CTA when not provided", () => {
    render(<LeadValidationCard result={baseResult} />);

    expect(screen.queryByRole("link", { name: /voltar/i })).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<LeadValidationCard result={baseResult} className="custom-class" />);

    const card = screen.getByRole("region", { name: "Validação de Lead" });
    expect(card).toHaveClass("custom-class");
  });

  it("has proper accessibility attributes", () => {
    render(<LeadValidationCard result={baseResult} />);

    const title = screen.getByRole("heading", { name: "Validação de Lead" });
    expect(title).toBeInTheDocument();

    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("aria-labelledby", expect.stringContaining("lead-validation-title"));
  });

  it("displays reasons as a list", () => {
    const result: LeadValidationResult = {
      ...baseResult,
      status: "incomplete",
      reasons: ["Razão 1", "Razão 2", "Razão 3"],
    };

    render(<LeadValidationCard result={result} />);

    const listItems = screen.getAllByTestId("reason-item");
    expect(listItems).toHaveLength(3);
    expect(listItems[0]).toHaveTextContent("Razão 1");
    expect(listItems[1]).toHaveTextContent("Razão 2");
    expect(listItems[2]).toHaveTextContent("Razão 3");
  });

  it("shows normalized section with proper labels", () => {
    const result: LeadValidationResult = {
      ...baseResult,
      normalized: {
        email: "test@example.com",
        phone: "+5511987654321",
      },
    };

    render(<LeadValidationCard result={result} />);

    expect(screen.getByText("E-mail")).toBeInTheDocument();
    expect(screen.getByText("Telefone")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("+5511987654321")).toBeInTheDocument();
  });

  it("handles empty normalized data gracefully", () => {
    render(<LeadValidationCard result={baseResult} />);

    expect(screen.queryByText("E-mail")).not.toBeInTheDocument();
    expect(screen.queryByText("Telefone")).not.toBeInTheDocument();
    expect(screen.queryByText("Endereço")).not.toBeInTheDocument();
    expect(screen.queryByText("UF")).not.toBeInTheDocument();
  });
});