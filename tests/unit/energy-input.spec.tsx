import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EnergyInputForm } from "@/components/analysis/EnergyInput";
import * as personaContext from "@/lib/persona/context";

// Mock the persona context
vi.mock("@/lib/persona/context", () => {
  return {
    usePersona: vi.fn(),
  };
});

// Mock React Hook Form
vi.mock("react-hook-form", () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: vi.fn(),
    formState: { errors: {} },
    watch: vi.fn(),
    setValue: vi.fn(),
  }),
}));

// Mock React Hook Form
vi.mock("react-hook-form", () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: vi.fn(),
    formState: { errors: {} },
    watch: vi.fn(),
    setValue: vi.fn(),
  }),
}));

describe("EnergyInputForm", () => {
  const mockOnSubmit = vi.fn();
  const defaultProps = {
    onSubmit: mockOnSubmit,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Owner Persona", () => {
    beforeEach(() => {
      vi.mocked(personaContext.usePersona).mockReturnValue({ 
        mode: "owner",
        permissions: ["owner"],
        featureFlags: { wizard: true },
        setMode: vi.fn(),
        hasPermission: vi.fn(),
        isEnabled: vi.fn()
      });
    });

    it("renders simplified form for owner persona", () => {
      render(<EnergyInputForm {...defaultProps} />);

      expect(screen.getByText("Dados de Energia")).toBeInTheDocument();
      expect(screen.getByLabelText(/consumo mensal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tarifa de energia/i)).toBeInTheDocument();
      expect(screen.getByText("Próximo")).toBeInTheDocument();
    });

    it("shows file upload option for owner", () => {
      render(<EnergyInputForm {...defaultProps} />);

      expect(screen.getByText(/upload da conta/i)).toBeInTheDocument();
    });
  });

  describe("Integrator Persona", () => {
    beforeEach(() => {
      vi.mocked(personaContext.usePersona).mockReturnValue({ 
        mode: "integrator",
        permissions: ["integrator"],
        featureFlags: { batch: true, advanced: true },
        setMode: vi.fn(),
        hasPermission: vi.fn(),
        isEnabled: vi.fn()
      });
    });

    it("renders technical form for integrator persona", () => {
      render(<EnergyInputForm {...defaultProps} />);

      expect(screen.getByText("Dados Técnicos de Energia")).toBeInTheDocument();
      expect(screen.getByLabelText(/consumo mensal/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/tarifa de energia/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/irradiância solar/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fator de potência/i)).toBeInTheDocument();
      expect(screen.getByText("Analisar Viabilidade")).toBeInTheDocument();
    });

    it("shows advanced options for integrator", () => {
      render(<EnergyInputForm {...defaultProps} />);

      expect(screen.getByText(/opções avançadas/i)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    beforeEach(() => {
      vi.mocked(personaContext.usePersona).mockReturnValue({ 
        mode: "owner",
        permissions: ["owner"],
        featureFlags: { wizard: true },
        setMode: vi.fn(),
        hasPermission: vi.fn(),
        isEnabled: vi.fn()
      });
    });

    it("validates required fields", async () => {
      render(<EnergyInputForm {...defaultProps} />);

      const submitButton = screen.getByText("Próximo");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });

    it("accepts valid energy consumption", async () => {
      render(<EnergyInputForm {...defaultProps} />);

      const consumptionInput = screen.getByLabelText(/consumo mensal/i);
      const tariffInput = screen.getByLabelText(/tarifa de energia/i);

      fireEvent.change(consumptionInput, { target: { value: "500" } });
      fireEvent.change(tariffInput, { target: { value: "0.8" } });

      const submitButton = screen.getByText("Próximo");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          monthlyConsumption: 500,
          tariff: 0.8,
          irradiance: 4.5,
          powerFactor: 0.92,
        });
      });
    });
  });

  describe("File Upload", () => {
    beforeEach(() => {
      vi.mocked(personaContext.usePersona).mockReturnValue({ 
        mode: "owner",
        permissions: ["owner"],
        featureFlags: { wizard: true },
        setMode: vi.fn(),
        hasPermission: vi.fn(),
        isEnabled: vi.fn()
      });
    });

    it("handles CSV file upload", async () => {
      render(<EnergyInputForm {...defaultProps} />);

      const fileInput = screen.getByLabelText(/upload da conta/i);
      const file = new File(
        ["Mês,Consumo kWh\nJan,450\nFev,480"],
        "conta.csv",
        {
          type: "text/csv",
        }
      );

      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByDisplayValue("465")).toBeInTheDocument();
      });
    });
  });

  describe("Loading State", () => {
    beforeEach(() => {
      vi.mocked(personaContext.usePersona).mockReturnValue({ 
        mode: "owner",
        permissions: ["owner"],
        featureFlags: { wizard: true },
        setMode: vi.fn(),
        hasPermission: vi.fn(),
        isEnabled: vi.fn()
      });
    });

    it("shows loading state during submission", () => {
      render(<EnergyInputForm {...defaultProps} isLoading={true} />);

      expect(screen.getByText("Analisando...")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});
