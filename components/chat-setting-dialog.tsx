import { Settings, SettingsIcon, Usb, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { memo, startTransition, useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Separator } from './ui/separator';
import type { ToolMetadata } from '../lib/ai/tools';
import { ChatSettingsConfig, useChatSetting } from './chat-setting-provider';

type ChatSettingTabId = 'tools';

interface ChatSettingTab {
  name: string;
  description: string;
  icon: React.ReactNode;
  content: (config: ChatSettingsConfig) => React.ReactNode;
}

interface PureChatSettingDialogProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

const ChatSettingSidebarButton = (
  props: ChatSettingTab & {
    id: ChatSettingTabId;
    focus: boolean;
    setActiveSettingsTab: (tab: ChatSettingTabId) => void;
  },
) => {
  const { id, name, focus, setActiveSettingsTab } = props;
  return (
    <Button
      variant={focus ? 'secondary' : 'ghost'}
      size="sm"
      className="w-full justify-start"
      onClick={() => setActiveSettingsTab(id)}
    >
      <Wrench className="h-4 w-4 mr-2" />
      {name}
    </Button>
  );
};

const ChatSettingTools = ({
  config,
  onUpdateToolConfig,
}: {
  config?: ChatSettingsConfig;
  onUpdateToolConfig?: (updatedTool: ChatSettingsConfig['tools']) => void;
}) => {
  return (
    <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
      {Object.entries(config?.tools ?? {}).map(([key, tool]) => (
        <div key={key} className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg">
              <Usb />
            </div>
            <div>
              <div className="text-sm font-medium">{key}</div>
              <div className="text-xs text-muted-foreground">
                {tool.description}
              </div>
            </div>
          </div>
          <Switch
            checked={tool.enabled}
            onCheckedChange={(checked) => {
              const updatedTool = {
                ...tool,
                enabled: checked,
              };
              const updatedTools = {
                ...config?.tools,
                [key]: updatedTool,
              };
              onUpdateToolConfig?.(updatedTools);
            }}
          />
        </div>
      ))}
    </div>
  );
};

const CHAT_SETTINGS: Record<ChatSettingTabId, ChatSettingTab> = {
  tools: {
    name: 'MCP Tools',
    description: 'Enable or disable MCP tools',
    icon: <Wrench className="h-4 w-4" />,
    content: (params: any) => <ChatSettingTools {...params} />,
  },
};

const ChatSettingHeader = ({
  activeSettingsTab,
}: { activeSettingsTab: ChatSettingTabId }) => {
  const { description } = CHAT_SETTINGS[activeSettingsTab];

  return (
    <div className="mb-2">
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

const PureChatSettingDialog: React.FC<PureChatSettingDialogProps> = ({
  showSettings,
  setShowSettings,
}) => {
  const [activeSettingsTab, setActiveSettingsTab] =
    useState<ChatSettingTabId>('tools');
  const { chatSettingConfig, setChatSettingConfig } = useChatSetting();

  return (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </DialogTitle>
          <DialogDescription>Customize your experience.</DialogDescription>
        </DialogHeader>

        <div className="flex">
          {/* Sidebar */}
          <div className="w-[180px] border-r p-2 ">
            {Object.entries(CHAT_SETTINGS).map(([key, setting]) => (
              <ChatSettingSidebarButton
                key={key}
                id={key as ChatSettingTabId}
                {...setting}
                focus={activeSettingsTab === key}
                setActiveSettingsTab={setActiveSettingsTab}
              />
            ))}
          </div>
          {/* Content List */}
          <div className="flex-1 p-4">
            {/* Header */}
            <ChatSettingHeader activeSettingsTab={activeSettingsTab} />
            <Separator className="my-2" />
            {/* Content Area */}
            {activeSettingsTab === 'tools' && (
              <ChatSettingTools
                config={chatSettingConfig}
                onUpdateToolConfig={(updatedTool) => {
                  startTransition(() => {
                    setChatSettingConfig({
                      ...chatSettingConfig,
                      tools: updatedTool,
                    });
                  });
                }}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ChatSettingDialog = memo(PureChatSettingDialog);

const PureChatSettingButton: React.FC<{ onClick: () => void }> = ({
  onClick,
}) => {
  return (
    <Button
      data-testid="settings-button"
      className="rounded-md rounded-bl-lg p-[7px] h-fit dark:border-zinc-700 hover:dark:bg-zinc-900 hover:bg-zinc-200"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      variant="ghost"
    >
      <SettingsIcon size={14} />
    </Button>
  );
};

export const ChatSettingButton = memo(PureChatSettingButton);
