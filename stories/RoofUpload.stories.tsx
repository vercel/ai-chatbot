import type { Meta, StoryObj } from '@storybook/react';
import { RoofUpload } from '@/components/detection/RoofUpload';

const meta: Meta<typeof RoofUpload> = {
	title: 'Detection/RoofUpload',
	component: RoofUpload,
	parameters: {
		layout: 'centered',
	},
};

export default meta;
type Story = StoryObj<typeof RoofUpload>;

export const Empty: Story = {
        args: {
                persona: 'owner',
                onAnalyze: (files) => console.log('Analyzing', files),
                isAnalyzing: false,
        },
};

export const WithFiles: Story = {
        args: {
                persona: 'owner',
                onAnalyze: (files) => console.log('Analyzing', files),
                isAnalyzing: false,
        },
};

export const Analyzing: Story = {
        args: {
                persona: 'owner',
                onAnalyze: (files) => console.log('Analyzing', files),
                isAnalyzing: true,
        },
};

export const ErrorState: Story = {
        args: {
                persona: 'owner',
                onAnalyze: (files) => console.log('Analyzing', files),
                isAnalyzing: false,
        },
};