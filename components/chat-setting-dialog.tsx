import { Server, Settings, SettingsIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { memo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ChatSettingMCP } from './chat-setting-mcp';

type ChatSettingTabId = 'mcp';

interface ChatSettingTab {
  name: string;
  description: string;
  icon: React.ReactNode;
  content: (params?: any) => React.ReactNode;
}

interface PureChatSettingDialogProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

const ChatSettingSidebarItem = (
  props: ChatSettingTab & {
    id: ChatSettingTabId;
    focus: boolean;
    setActiveTabId: (tab: ChatSettingTabId) => void;
  },
) => {
  const { id, icon, focus, setActiveTabId } = props;

  return (
    <Button
      variant={focus ? 'secondary' : 'ghost'}
      size="sm"
      className="w-full justify-start font-extrabold"
      onClick={() => setActiveTabId(id)}
    >
      {icon}
      {id.toUpperCase()}
    </Button>
  );
};

const CHAT_SETTINGS: Record<ChatSettingTabId, ChatSettingTab> = {
  mcp: {
    name: 'MCP Servers',
    description: 'Configure MCP servers for tool execution',
    icon: <Server className="h-4 w-4" />,
    content: (params: any) => <ChatSettingMCP {...params} />,
  },
};

const ChatSettingHeader = ({ activeTabId }: { activeTabId: ChatSettingTabId }) => {
  const { name, icon, description } = CHAT_SETTINGS[activeTabId];

  return (
    <div className="mb-2">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <>
          {icon}
          <span className="font-bold">{name}</span>
        </>
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

const PureChatSettingDialog: React.FC<PureChatSettingDialogProps> = ({
  showSettings,
  setShowSettings,
}) => {
  const [activeTabId, setActiveTabId] = useState<ChatSettingTabId>('mcp');

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
              <ChatSettingSidebarItem
                key={key}
                id={key as ChatSettingTabId}
                {...setting}
                focus={activeTabId === key}
                setActiveTabId={setActiveTabId}
              />
            ))}
          </div>
          <div className="h-[520px] flex-1 p-4 overflow-y-scroll">
            {/* Header */}
            <ChatSettingHeader activeTabId={activeTabId} />
            <Separator className="my-2" />
            {/* Content */}
            {CHAT_SETTINGS[activeTabId].content()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ChatSettingDialog = memo(PureChatSettingDialog);

const PureChatSettingButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
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
