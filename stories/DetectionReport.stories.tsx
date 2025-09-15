import type { Meta, StoryObj } from '@storybook/react';
import { DetectionReport } from '@/components/detection/DetectionReport';
import type { DetectionResult } from '@/lib/detection/types';

const mockResult: DetectionResult = {
	stage: 'detection',
	items: [
		{
			input: { name: 'roof.jpg', url: 'blob:test' },
			overlays: {
				bboxes: [
					{ x: 10, y: 10, w: 100, h: 50, score: 0.9 },
					{ x: 120, y: 10, w: 100, h: 50, score: 0.8 },
				],
			},
			metrics: {
				roof_coverage_m2: 150,
				panel_count: 10,
				confidence: 0.85,
				orientation: 'S',
				tilt_deg: 25,
			},
		},
	],
	summary: {
		roof_total_m2: 150,
		detected_panels: 10,
		confidence_avg: 0.85,
		recommendations: ['Orientação sul ideal', 'Inclinação adequada'],
	},
};

const meta: Meta<typeof DetectionReport> = {
	title: 'Detection/DetectionReport',
	component: DetectionReport,
	parameters: {
		layout: 'padded',
	},
};

export default meta;
type Story = StoryObj<typeof DetectionReport>;

export const OwnerWithPanels: Story = {
        args: {
                result: mockResult,
                persona: 'owner',
        },
};

export const IntegratorWithPanels: Story = {
        args: {
                result: mockResult,
                persona: 'integrator',
                onExport: () => console.log('Export'),
        },
};

export const NoPanels: Story = {
	args: {
		result: {
			...mockResult,
			items: [
				{
					...mockResult.items[0],
					overlays: { bboxes: [] },
					metrics: { ...mockResult.items[0].metrics, panel_count: 0 },
				},
                        ],
                        summary: { ...mockResult.summary, detected_panels: 0 },
                },
                persona: 'owner',
        },
};