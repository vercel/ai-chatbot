import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViabilityReport } from '@/components/analysis/ViabilityReport';

// Mock the persona context
const mockUsePersona = vi.fn();
vi.mock('@/lib/persona/context', () => ({
  usePersona: mockUsePersona,
}));

// Mock the router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('ViabilityReport', () => {
  const mockResult = {
    stage: 'analysis' as const,
    inputs: {
      persona: 'owner',
      utility: 'CEMIG',
      uf: 'MG',
      avg_kwh_month: 500,
      tariff_rs_kwh: 0.8,
    },
    assumptions: {
      PR: 0.75,
      kwh_per_kwp_month: 135,
      capex_per_kwp: 1000,
      inflation_tariff: 0.05,
    },
    estimates: {
      estimated_kwp: 8.5,
      gen_month: 1148,
      bill_now: 400,
      savings_month: 318,
      capex: 8500,
      payback_years: 6.8,
      roi_5y: 14.7,
      roi_10y: 18.2,
    },
    summary: {
      headline: 'Sistema Viável - Retorno em 6.8 anos',
      bullets: [
        'Economia mensal de R$ 318',
        ' payback em 6.8 anos',
        'ROI de 14.7% em 5 anos',
      ],
    },
  };

  const mockOnNewAnalysis = vi.fn();

  const defaultProps = {
    result: mockResult,
    onNewAnalysis: mockOnNewAnalysis,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Owner Persona', () => {
    beforeEach(() => {
      mockUsePersona.mockReturnValue({ persona: 'owner' });
    });

    it('renders simplified report for owner persona', () => {
      render(<ViabilityReport {...defaultProps} />);

      expect(screen.getByText('Relatório de Viabilidade')).toBeInTheDocument();
      expect(screen.getByText('Economia Anual')).toBeInTheDocument();
      expect(screen.getByText('R$ 1.224')).toBeInTheDocument();
      expect(screen.getByText('Payback')).toBeInTheDocument();
      expect(screen.getByText('6.8 anos')).toBeInTheDocument();
      expect(screen.getByText('Nova Análise')).toBeInTheDocument();
    });

    it('shows key metrics prominently', () => {
      render(<ViabilityReport {...defaultProps} />);

      expect(screen.getByText('8.5 kWp')).toBeInTheDocument(); // System size
      expect(screen.getByText('15.300 kWh')).toBeInTheDocument(); // Generation
      expect(screen.getByText('14.7%')).toBeInTheDocument(); // ROI
    });
  });

  describe('Integrator Persona', () => {
    beforeEach(() => {
      mockUsePersona.mockReturnValue({ persona: 'integrator' });
    });

    it('renders technical report for integrator persona', () => {
      render(<ViabilityReport {...defaultProps} />);

      expect(screen.getByText('Análise Técnica de Viabilidade')).toBeInTheDocument();
      expect(screen.getByText('Dados Técnicos')).toBeInTheDocument();
      expect(screen.getByText('Métricas Financeiras')).toBeInTheDocument();
      expect(screen.getByText('LCOE')).toBeInTheDocument();
      expect(screen.getByText('R$ 0.12/kWh')).toBeInTheDocument();
      expect(screen.getByText('NPV')).toBeInTheDocument();
      expect(screen.getByText('R$ 12.500')).toBeInTheDocument();
    });

    it('shows confidence indicator', () => {
      render(<ViabilityReport {...defaultProps} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
    });
  });

  describe('Chart Visualization', () => {
    beforeEach(() => {
      mockUsePersona.mockReturnValue({ persona: 'owner' });
    });

    it('renders SVG chart', () => {
      render(<ViabilityReport {...defaultProps} />);

      const chart = document.querySelector('svg');
      expect(chart).toBeInTheDocument();
    });

    it('displays chart with correct data', () => {
      render(<ViabilityReport {...defaultProps} />);

      expect(screen.getByText('Geração Estimada')).toBeInTheDocument();
      expect(screen.getByText('15.300 kWh/ano')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      mockUsePersona.mockReturnValue({ persona: 'owner' });
    });

    it('shows export options', () => {
      render(<ViabilityReport {...defaultProps} />);

      expect(screen.getByText('Exportar')).toBeInTheDocument();
    });

    it('triggers export when clicked', async () => {
      // Mock window.open
      const mockOpen = vi.fn();
      Object.defineProperty(window, 'open', {
        writable: true,
        value: mockOpen,
      });

      render(<ViabilityReport {...defaultProps} />);

      const exportButton = screen.getByText('Exportar');
      fireEvent.click(exportButton);

      // Should open export URL
      expect(mockOpen).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockUsePersona.mockReturnValue({ persona: 'owner' });
    });

    it('navigates to next phase on continue', () => {
      render(<ViabilityReport {...defaultProps} />);

      const continueButton = screen.getByText('Continuar para Dimensionamento');
      fireEvent.click(continueButton);

      expect(mockPush).toHaveBeenCalledWith('/journey/dimensioning');
    });

    it('starts new analysis', () => {
      render(<ViabilityReport {...defaultProps} />);

      const newAnalysisButton = screen.getByText('Nova Análise');
      fireEvent.click(newAnalysisButton);

      expect(mockOnNewAnalysis).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUsePersona.mockReturnValue({ persona: 'owner' });
    });

    it('has proper ARIA labels', () => {
      render(<ViabilityReport {...defaultProps} />);

      expect(screen.getByRole('region', { name: /relatório de viabilidade/i })).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<ViabilityReport {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        expect(button).toHaveAttribute('tabIndex');
      }
    });
  });
});