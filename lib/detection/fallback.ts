import type { DetectionResult, DetectionItem } from './types';

// Mock determinístico baseado no nome do arquivo
export async function mockRoofSegment(
	url: string,
	name: string,
): Promise<{
	maskUrl: string;
	roof_coverage_m2: number;
	orientation?: string;
	tilt_deg?: number;
	confidence: number;
}> {
	// Determinístico baseado no hash do nome
	const hash = name.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
	const coverage = 50 + (hash % 100); // 50-150 m2
	const orientations = ["N", "S", "L", "O", "NE", "NW", "SE", "SW"];
	const orientation = orientations[hash % orientations.length];
	const tilt = 20 + (hash % 20); // 20-40 deg
	const confidence = 0.7 + (hash % 30) / 100; // 0.7-1.0

	// Mock maskUrl: uma imagem base64 simples (quadrado branco)
	const maskUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

	return {
		maskUrl,
		roof_coverage_m2: coverage,
		orientation,
		tilt_deg: tilt,
		confidence,
	};
}

export async function mockPanelDetect(
	url: string,
	name: string,
): Promise<{
	bboxes: Array<{ x: number; y: number; w: number; h: number; score?: number }>;
	panel_count: number;
	confidence: number;
}> {
	const hash = name.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
	const count = 5 + (hash % 15); // 5-20 painéis
	const confidence = 0.6 + (hash % 40) / 100; // 0.6-1.0

	const bboxes = [];
	for (let i = 0; i < count; i++) {
		bboxes.push({
			x: (i * 100) % 800,
			y: (i * 50) % 600,
			w: 80 + (hash % 20),
			h: 40 + (hash % 10),
			score: confidence,
		});
	}

	return {
		bboxes,
		panel_count: count,
		confidence,
	};
}

export async function mockDetectionAnalysis(
	files: Array<{ name: string; url: string }>,
): Promise<DetectionResult> {
	const items: DetectionItem[] = [];

	for (const file of files) {
		const roof = await mockRoofSegment(file.url, file.name);
		const panels = await mockPanelDetect(file.url, file.name);

		items.push({
			input: {
				name: file.name,
				url: file.url,
			},
			overlays: {
				maskUrl: roof.maskUrl,
				bboxes: panels.bboxes,
			},
			metrics: {
				roof_coverage_m2: roof.roof_coverage_m2,
				panel_count: panels.panel_count,
				confidence: (roof.confidence + panels.confidence) / 2,
				orientation: roof.orientation,
				tilt_deg: roof.tilt_deg,
			},
		});
	}

	const totalRoof = items.reduce(
		(sum, item) => sum + (item.metrics?.roof_coverage_m2 || 0),
		0,
	);
	const totalPanels = items.reduce(
		(sum, item) => sum + (item.metrics?.panel_count || 0),
		0,
	);
	const avgConfidence =
		items.reduce((sum, item) => sum + (item.metrics?.confidence || 0), 0) /
		items.length;

	return {
		stage: "detection",
		items,
		summary: {
			roof_total_m2: totalRoof,
			detected_panels: totalPanels,
			confidence_avg: avgConfidence,
			recommendations: [
				"Verifique a orientação do telhado para otimização.",
				"Considere a inclinação para melhor eficiência.",
			],
		},
	};
}
