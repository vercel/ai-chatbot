import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import IntentInput from "@/components/intent/IntentInput";
import type { LeadValidationResult } from "@/lib/lead/types";

// Mock the server action
vi.mock("@/app/actions/validateLeadAction", () => ({
  validateLeadAction: vi.fn(),
}));

// Mock fetch for API mode
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("IntentInput", () => {
  const mockOnValidated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Import the mocked function
    const { validateLeadAction } = require("@/app/actions/validateLeadAction");
    validateLeadAction.mockResolvedValue({
      isValidLead: true,
      status: "approved",
      reasons: [],
      normalized: {},
      next: { primaryCta: { label: "Continue", href: "/next" } },
      confidence: 0.8,
    } as LeadValidationResult);
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({
        isValidLead: true,
        status: "approved",
        reasons: [],
        normalized: {},
        next: { primaryCta: { label: "Continue", href: "/next" } },
        confidence: 0.8,
      }),
    } as Response);
  });

  it("renders the form with default fields", () => {
    render(<IntentInput onValidated={mockOnValidated} />);

    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/endereço/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/persona/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/objetivo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notas/i)).toBeInTheDocument();
  });

  it("renders with compact layout by default", () => {
    render(<IntentInput onValidated={mockOnValidated} />);

    const form = screen.getByRole("form");
    expect(form).toHaveClass("grid-cols-1");
  });

  it("renders with wide layout when specified", () => {
    render(<IntentInput layout="wide" onValidated={mockOnValidated} />);

    const form = screen.getByRole("form");
    expect(form).toHaveClass("grid-cols-1", "md:grid-cols-2");
  });

  it("shows validation errors for required fields", async () => {
    render(<IntentInput onValidated={mockOnValidated} />);

    const submitButton = screen.getByRole("button", { name: /continuar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/informe seu nome/i)).toBeInTheDocument();
    });
  });

  it("submits form with server action by default", async () => {
    render(<IntentInput onValidated={mockOnValidated} />);

    const nameInput = screen.getByLabelText(/nome/i);
    fireEvent.change(nameInput, { target: { value: "João Silva" } });

    const submitButton = screen.getByRole("button", { name: /continuar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const { validateLeadAction } = require("@/app/actions/validateLeadAction");
      expect(validateLeadAction).toHaveBeenCalledWith(
        expect.objectContaining({ name: "João Silva" })
      );
    });
  });

  it("submits form with API when specified", async () => {
    render(<IntentInput submitMode="api" onValidated={mockOnValidated} />);

    const nameInput = screen.getByLabelText(/nome/i);
    fireEvent.change(nameInput, { target: { value: "João Silva" } });

    const submitButton = screen.getByRole("button", { name: /continuar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/lead/validate", expect.any(Object));
    });
  });

  it("calls onValidated callback after successful submission", async () => {
    render(<IntentInput onValidated={mockOnValidated} />);

    const nameInput = screen.getByLabelText(/nome/i);
    fireEvent.change(nameInput, { target: { value: "João Silva" } });

    const submitButton = screen.getByRole("button", { name: /continuar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnValidated).toHaveBeenCalledWith(
        expect.objectContaining({ status: "approved" })
      );
    });
  });

  it("shows loading state during submission", async () => {
    const { validateLeadAction } = require("@/app/actions/validateLeadAction");
    validateLeadAction.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<IntentInput onValidated={mockOnValidated} />);

    const nameInput = screen.getByLabelText(/nome/i);
    fireEvent.change(nameInput, { target: { value: "João Silva" } });

    const submitButton = screen.getByRole("button", { name: /continuar/i });
    fireEvent.click(submitButton);

    expect(screen.getByRole("button", { name: /validando/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /continuar/i })).toBeInTheDocument();
    });
  });

  it("clears form when reset button is clicked", () => {
    render(<IntentInput onValidated={mockOnValidated} />);

    const nameInput = screen.getByLabelText(/nome/i);
    fireEvent.change(nameInput, { target: { value: "João Silva" } });

    expect(nameInput).toHaveValue("João Silva");

    const resetButton = screen.getByRole("button", { name: /limpar/i });
    fireEvent.click(resetButton);

    expect(nameInput).toHaveValue("");
  });

  it("applies custom className", () => {
    render(<IntentInput className="custom-class" onValidated={mockOnValidated} />);

    const container = screen.getByRole("form").parentElement;
    expect(container).toHaveClass("custom-class");
  });

  it("renders custom fields when provided", () => {
    const customFields = [
      { name: "name" as const, label: "Nome Completo", required: true, type: "text" as const },
      { name: "email" as const, label: "Email Profissional", type: "email" as const },
    ];

    render(<IntentInput fields={customFields} onValidated={mockOnValidated} />);

    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email profissional/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/telefone/i)).not.toBeInTheDocument();
  });
});