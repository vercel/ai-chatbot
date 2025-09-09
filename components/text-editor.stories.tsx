import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Editor } from './text-editor';

const meta: Meta<typeof Editor> = {
  title: 'Components/TextEditor',
  component: Editor,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Rich text editor component using ProseMirror for document editing.',
      },
    },
  },
  argTypes: {
    content: {
      control: 'text',
      description: 'Initial content for the editor',
    },
    status: {
      control: 'select',
      options: ['streaming', 'idle'],
      description: 'Current status of the editor',
    },
    isCurrentVersion: {
      control: 'boolean',
      description: 'Whether this is the current version',
    },
    currentVersionIndex: {
      control: 'number',
      description: 'Index of the current version',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Editor>;

export const Default: Story = {
  args: {
    content: '# Solar Panel Analysis\n\nThis document contains a comprehensive analysis of solar panel installation options for residential properties.\n\n## Key Benefits\n\n- **Cost Savings**: Reduce electricity bills by up to 70%\n- **Environmental Impact**: Clean energy production\n- **Property Value**: Increased home value\n\n## Recommendations\n\nBased on the analysis, we recommend a 8.5kW system with premium panels.',
    onSaveContent: (content: string, debounce: boolean) => {
      console.log('Content saved:', content, 'Debounce:', debounce);
    },
    status: 'idle',
    isCurrentVersion: true,
    currentVersionIndex: 0,
    suggestions: [],
  },
};

export const WithSuggestions: Story = {
  args: {
    ...Default.args,
    suggestions: [
      {
        id: '1',
        createdAt: new Date(),
        userId: 'user-1',
        documentId: 'doc-1',
        documentCreatedAt: new Date(),
        originalText: 'cost savings',
        suggestedText: 'potential cost savings',
        description: 'More precise wording',
        isResolved: false,
      },
      {
        id: '2',
        createdAt: new Date(),
        userId: 'user-1',
        documentId: 'doc-1',
        documentCreatedAt: new Date(),
        originalText: '8.5kW system',
        suggestedText: '8.5 kW solar system',
        description: 'Add "solar" for clarity',
        isResolved: false,
      },
    ],
  },
};

export const Streaming: Story = {
  args: {
    ...Default.args,
    status: 'streaming',
    content: '# Solar Analysis Report\n\nGenerating comprehensive analysis...',
  },
};

export const PreviousVersion: Story = {
  args: {
    ...Default.args,
    isCurrentVersion: false,
    currentVersionIndex: 1,
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    content: '',
  },
};

export const LongDocument: Story = {
  args: {
    ...Default.args,
    content: `# Comprehensive Solar Energy Analysis Report

## Executive Summary

This detailed report provides a comprehensive analysis of solar energy opportunities for residential and commercial properties in the target area.

## Methodology

The analysis was conducted using advanced modeling techniques including:
- Solar irradiance mapping
- Energy consumption patterns
- Financial projections
- Environmental impact assessment

## Key Findings

### Energy Production Potential
- Average daily production: 32 kWh
- Peak production hours: 10 AM - 4 PM
- Seasonal variations: ±15%

### Financial Analysis
- Initial investment: $25,000 - $35,000
- Payback period: 6-8 years
- 20-year savings: $45,000 - $65,000
- Return on investment: 15-22%

### Environmental Impact
- CO₂ reduction: 8-12 tons annually
- Equivalent to planting 80-120 trees
- Carbon footprint reduction: 70%

## Recommendations

### System Configuration
- Recommended size: 8.5 kW
- Panel type: Premium monocrystalline
- Inverter: String inverter with monitoring
- Battery storage: Optional 10 kWh system

### Implementation Timeline
1. Site assessment (Week 1-2)
2. System design (Week 3-4)
3. Permitting (Week 5-6)
4. Installation (Week 7-8)
5. Inspection and activation (Week 9)

## Conclusion

Solar energy represents a viable and attractive option for property owners seeking to reduce energy costs while contributing to environmental sustainability. The recommended system provides excellent financial returns and significant environmental benefits.

---

*Report generated on ${new Date().toLocaleDateString()}*`,
  },
};