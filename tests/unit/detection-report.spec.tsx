import { render, screen } from '@testing-library/react';
import { DetectionReport } from '@/components/detection/DetectionReport';
import type { DetectionResult } from '@/lib/detection/types';

const mockResult: DetectionResult = {
	stage: 'detection',
	items: [
		{
			input: { name: 'test.jpg', url: 'blob:test' },
			overlays: {
				bboxes: [{ x: 10, y: 10, w: 100, h: 50, score: 0.9 }],
			},
			metrics: {
				roof_coverage_m2: 100,
				panel_count: 5,
				confidence: 0.85,
			},
		},
	],
	summary: {
		roof_total_m2: 100,
		detected_panels: 5,
		confidence_avg: 0.85,
		recommendations: ['Teste recomendação'],
	},
};

describe('DetectionReport', () => {
	const mockOnProceed = vi.fn();
	const mockOnBack = vi.fn();
	const mockOnExport = vi.fn();

	it('renders report with metrics', () => {
		render(
			<DetectionReport
				result={mockResult}
				persona="owner"
				onProceed={mockOnProceed}
				onBack={mockOnBack}
				onExport={mockOnExport}
			/>
		);

		expect(screen.getByText('Relatório de Detecção')).toBeInTheDocument();
		expect(screen.getByText('100.0 m²')).toBeInTheDocument();
		expect(screen.getByText('5')).toBeInTheDocument();
	});

	it('shows export button for integrator', () => {
		render(
			<DetectionReport
				result={mockResult}
				persona="integrator"
				onProceed={mockOnProceed}
				onBack={mockOnBack}
				onExport={mockOnExport}
			/>
		);

		expect(screen.getByText('Exportar CSV')).toBeInTheDocument();
	});

	it('calls onProceed when button clicked', () => {
		render(
			<DetectionReport
				result={mockResult}
				persona="owner"
				onProceed={mockOnProceed}
				onBack={mockOnBack}
			/>
		);

		const button = screen.getByText('Prosseguir para Análise');
		fireEvent.click(button);

		expect(mockOnProceed).toHaveBeenCalled();
	});
});