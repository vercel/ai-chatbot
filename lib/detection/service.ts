import type { DetectionResult } from './types';
import { mockDetectionAnalysis, mockRoofSegment, mockPanelDetect } from './fallback';

export async function analyzeRoofDetection(
	files: Array<{ name: string; url: string; type: string; size: number }>,
	persona: 'owner' | 'integrator' = 'owner',
): Promise<DetectionResult> {
	const apiUrl = process.env.DETECTION_API_URL;

	if (apiUrl) {
		try {
			// Tentar chamar serviço real
			const response = await fetch(`${apiUrl}/analyze`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					persona,
					files,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				// Assumir que o serviço retorna dados compatíveis
				return data as DetectionResult;
			}
			console.warn('Detection API failed, falling back to mock');
		} catch (error) {
			console.warn('Error calling detection API:', error);
		}
	}

	// Fallback to mock
	return mockDetectionAnalysis(files);
}

// Funções individuais para tools abstratas
export async function roofSegment(url: string, fileId?: string): Promise<{
	maskUrl: string;
	roof_coverage_m2: number;
	orientation?: string;
	tilt_deg?: number;
	confidence: number;
}> {
	const apiUrl = process.env.DETECTION_API_URL;

	if (apiUrl) {
		try {
			const response = await fetch(`${apiUrl}/roof-segment`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ url, fileId }),
			});

			if (response.ok) {
				return await response.json();
			}
		} catch (error) {
			console.warn('Error calling roof segment API:', error);
		}
	}

	// Fallback
	const name = fileId || url.split('/').pop() || 'unknown';
	return mockRoofSegment(url, name);
}

export async function panelDetect(url: string, fileId?: string): Promise<{
	bboxes: Array<{ x: number; y: number; w: number; h: number; score?: number }>;
	panel_count: number;
	confidence: number;
}> {
	const apiUrl = process.env.DETECTION_API_URL;

	if (apiUrl) {
		try {
			const response = await fetch(`${apiUrl}/panel-detect`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ url, fileId }),
			});

			if (response.ok) {
				return await response.json();
			}
		} catch (error) {
			console.warn('Error calling panel detect API:', error);
		}
	}

	// Fallback
	const name = fileId || url.split('/').pop() || 'unknown';
	return mockPanelDetect(url, name);
}