import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { JourneyNavigation } from './journey-navigation';
import type { Phase } from '@/apps/web/lib/journey/map';

const meta: Meta<typeof JourneyNavigation> = {
  title: 'Components/JourneyNavigation',
  component: JourneyNavigation,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Navigation component for moving between journey phases in the solar energy workflow.',
      },
    },
  },
  argTypes: {
    currentPhase: {
      control: 'select',
      options: ['investigation', 'detection', 'analysis', 'dimensioning', 'recommendation', 'leadmgmt'],
      description: 'Current active phase',
    },
  },
};

export default meta;
type Story = StoryObj<typeof JourneyNavigation>;

export const Default: Story = {
  args: {
    currentPhase: 'investigation' as Phase,
    onPhaseChange: (phase: Phase) => console.log('Phase changed to:', phase),
  },
};

export const InvestigationPhase: Story = {
  args: {
    ...Default.args,
    currentPhase: 'investigation' as Phase,
  },
};

export const DetectionPhase: Story = {
  args: {
    ...Default.args,
    currentPhase: 'detection' as Phase,
  },
};

export const AnalysisPhase: Story = {
  args: {
    ...Default.args,
    currentPhase: 'analysis' as Phase,
  },
};

export const DimensioningPhase: Story = {
  args: {
    ...Default.args,
    currentPhase: 'dimensioning' as Phase,
  },
};

export const RecommendationPhase: Story = {
  args: {
    ...Default.args,
    currentPhase: 'recommendation' as Phase,
  },
};

export const LeadManagementPhase: Story = {
  args: {
    ...Default.args,
    currentPhase: 'leadmgmt' as Phase,
  },
};

export const NoCurrentPhase: Story = {
  args: {
    onPhaseChange: (phase: Phase) => console.log('Phase changed to:', phase),
  },
};

export const InWorkflow: Story = {
  render: (args) => (
    <div className="p-6 bg-background border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Solar Energy Assessment Workflow</h3>
      <div className="space-y-4">
        <JourneyNavigation {...args} />
        <div className="text-sm text-muted-foreground">
          Navigate through the different phases of the solar energy assessment process.
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Current Phase:</strong> {args.currentPhase || 'None'}
          </div>
          <div>
            <strong>Available Actions:</strong> Previous/Next navigation
          </div>
        </div>
      </div>
    </div>
  ),
  args: {
    ...Default.args,
  },
};