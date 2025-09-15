import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { RoofUpload } from '@/components/detection/RoofUpload';

describe('RoofUpload', () => {
	const mockOnAnalyze = vi.fn();

	beforeEach(() => {
		mockOnAnalyze.mockClear();
	});

        it('renders upload area', () => {
                render(<RoofUpload persona="owner" onAnalyze={mockOnAnalyze} />);
		expect(screen.getByText(/Arraste imagens aqui/)).toBeInTheDocument();
	});

        it('validates file type', () => {
                render(<RoofUpload persona="owner" onAnalyze={mockOnAnalyze} />);
		const input = screen.getByLabelText(/Selecionar imagens/);

		const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
		fireEvent.change(input, { target: { files: [invalidFile] } });

		expect(screen.getByText('Apenas imagens são permitidas')).toBeInTheDocument();
	});

        it('validates file size', () => {
                render(<RoofUpload persona="owner" onAnalyze={mockOnAnalyze} />);
		const input = screen.getByLabelText(/Selecionar imagens/);

		const largeFile = new File(['x'.repeat(9 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
		fireEvent.change(input, { target: { files: [largeFile] } });

		expect(screen.getByText('Arquivo muito grande (máx. 8MB)')).toBeInTheDocument();
	});

        it('calls onAnalyze with valid files', () => {
                render(<RoofUpload persona="owner" onAnalyze={mockOnAnalyze} />);
		const input = screen.getByLabelText(/Selecionar imagens/);

		const validFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
		fireEvent.change(input, { target: { files: [validFile] } });

		const button = screen.getByText('Analisar Telhado');
		fireEvent.click(button);

		expect(mockOnAnalyze).toHaveBeenCalledWith([
			expect.objectContaining({
				name: 'test.jpg',
				type: 'image/jpeg',
			}),
		]);
	});
});