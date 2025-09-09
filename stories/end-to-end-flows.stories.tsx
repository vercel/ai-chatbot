import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Chat } from '../chat';
import { Message } from '../message';
import { Artifact } from '../artifact';
import { PersonaSwitcher } from '../persona-switcher';
import { ModelSelector } from '../model-selector';
import { JourneyNavigation } from '../journey-navigation';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import type { ChatMessage } from '@/lib/types';
import type { Session } from 'next-auth';
import type { Phase } from '@/apps/web/lib/journey/map';

// Mock data
const mockSession: Session = {
  user: {
    id: '1',
    email: 'test@example.com',
    type: 'regular',
  },
  expires: '2024-12-31',
};

const conversationMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'user',
    parts: [{ type: 'text', text: 'Hi, I want to install solar panels on my home. Can you help me?' }],
  },
  {
    id: '2',
    role: 'assistant',
    parts: [{ type: 'text', text: 'Absolutely! I can help you with your solar panel installation. Let me start by understanding your situation better. What type of property do you have and what\'s your monthly electricity bill?' }],
  },
  {
    id: '3',
    role: 'user',
    parts: [{ type: 'text', text: 'I have a 3-bedroom house and my average monthly bill is $180.' }],
  },
  {
    id: '4',
    role: 'assistant',
    parts: [{ type: 'text', text: 'Great! Based on your 3-bedroom house and $180 monthly electricity bill, I can provide you with a personalized solar analysis. Let me create a detailed assessment for you.' }],
  },
];

const meta: Meta = {
  title: 'Scenarios/End-to-End Flows',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'End-to-end user journey scenarios demonstrating the complete YSH solar energy assessment workflow.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const SolarConsultationFlow: Story = {
  render: () => (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">YSH Solar Assistant</h1>
            <PersonaSwitcher />
          </div>
          <div className="flex items-center gap-2">
            <ModelSelector session={mockSession} selectedModelId="gpt-4" />
            <Button variant="solar">New Chat</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="w-80 border-r bg-muted/30 p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Assessment Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <JourneyNavigation
                currentPhase="analysis"
                onPhaseChange={(phase) => console.log('Navigate to:', phase)}
              />
            </CardContent>
          </Card>

          <div className="mt-4 space-y-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📊 Generate Report
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  💰 Cost Calculator
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  📍 Find Installers
                </Button>
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {conversationMessages.map((message) => (
              <Message
                key={message.id}
                chatId="demo-chat"
                message={message}
                vote={undefined}
                isLoading={false}
                setMessages={() => {}}
                regenerate={() => {}}
                isReadonly={false}
                requiresScrollPadding={false}
                isArtifactVisible={false}
              />
            ))}
          </div>

          {/* Chat Input */}
          <div className="border-t p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 border rounded-md"
                  placeholder="Ask about solar panels, costs, installation..."
                  defaultValue="What are the best solar panels for my roof type?"
                />
                <Button variant="solar">Send</Button>
              </div>
            </div>
          </div>
        </main>

        {/* Artifact Panel */}
        <aside className="w-96 border-l bg-background">
          <Artifact
            chatId="demo-chat"
            input=""
            setInput={() => {}}
            status="ready"
            stop={() => {}}
            attachments={[]}
            setAttachments={() => {}}
            sendMessage={() => {}}
            messages={conversationMessages}
            setMessages={() => {}}
            regenerate={() => {}}
            votes={[]}
            isReadonly={false}
            selectedVisibilityType="private"
            selectedModelId="gpt-4"
          />
        </aside>
      </div>
    </div>
  ),
};

export const IntegratorDashboard: Story = {
  render: () => (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">YSH Integrator Portal</h1>
            <PersonaSwitcher />
          </div>
          <div className="flex items-center gap-2">
            <ModelSelector session={mockSession} selectedModelId="claude-3" />
            <Button variant="eco">Batch Process</Button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Quote Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$28,500</div>
                <p className="text-xs text-muted-foreground">+8% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">34%</div>
                <p className="text-xs text-muted-foreground">+5% from last month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Revenue Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1.2M</div>
                <p className="text-xs text-muted-foreground">+15% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Customer Interactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Sarah Johnson', action: 'Requested quote for 8.5kW system', time: '2 hours ago' },
                  { name: 'Mike Chen', action: 'Scheduled site assessment', time: '4 hours ago' },
                  { name: 'Emma Davis', action: 'Completed financing application', time: '6 hours ago' },
                  { name: 'Robert Wilson', action: 'Downloaded system specifications', time: '1 day ago' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium">{activity.name}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
};

export const MobileResponsiveFlow: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">YSH Solar</h1>
          <PersonaSwitcher />
        </div>
      </header>

      {/* Mobile Chat */}
      <div className="flex-1 p-4 space-y-4">
        {conversationMessages.slice(0, 2).map((message) => (
          <Message
            key={message.id}
            chatId="mobile-chat"
            message={message}
            vote={undefined}
            isLoading={false}
            setMessages={() => {}}
            regenerate={() => {}}
            isReadonly={false}
            requiresScrollPadding={false}
            isArtifactVisible={false}
          />
        ))}

        {/* Mobile Input */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 border rounded-md text-sm"
              placeholder="Ask about solar..."
            />
            <Button variant="solar" size="sm">Send</Button>
          </div>
        </div>
      </div>
    </div>
  ),
};