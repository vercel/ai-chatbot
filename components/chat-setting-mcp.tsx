import { type ChangeEvent, useCallback, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileJson,
  Plus,
  Server,
  X,
} from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deepMerge } from '@/lib/utils';
import { toast } from './toast';
import { type ChatSetting, useChatSetting } from '@/hooks/use-chatsetting';
import type { MCPServerConfig, MCPServerType } from '../lib/ai/mcp';
import { useMCP } from './mcp-provider';

export const ChatSettingMCP = () => {
  const { chatSetting, setChatSetting } = useChatSetting();
  const [addServerMethod, setAddServerMethod] = useState<'import' | 'manual'>(
    'manual',
  );
  const [newServer, setNewServer] = useState<MCPServerConfig>({
    name: '',
    type: 'remote',
    enabled: true,
    available: true,
    env: {},
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { refreshMCPTools } = useMCP();

  const handleFileImport = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!chatSetting) {
      return;
    }

    const mcpServers = await readMCPServersConfigFile(
      e.target.files?.[0] as File,
    );

    setChatSetting(
      deepMerge(chatSetting, {
        mcpServers: {
          ...chatSetting.mcpServers,
          ...Object.keys(mcpServers).reduce(
            (arr, serverId) => {
              if (chatSetting.mcpServers[serverId]) {
                arr[`${serverId}_2`] = chatSetting.mcpServers[serverId];
              }
              arr[serverId] = mcpServers[serverId];
              return arr;
            },
            {} as Record<string, MCPServerConfig>,
          ),
        },
        showAddServerForm: false,
      }) as ChatSetting,
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    await refreshMCPTools();
  };

  const addMcpServerManually = async () => {
    if (!chatSetting) {
      return;
    }

    const newServerId = newServer.name.toLowerCase().replace(/\s+/g, '_');
    const existingServer = chatSetting.mcpServers[newServerId];

    if (existingServer) {
      toast({
        type: 'error',
        description: `Server with name "${newServer.name}" already exists.`,
      });
      return;
    }

    if (
      newServer.type === 'remote' &&
      !newServer.url?.endsWith('/mcp') &&
      !newServer.url?.endsWith('/sse')
    ) {
      toast({
        type: 'error',
        description: 'Remote server URL must end with /mcp or /sse',
      });
      return;
    }

    setChatSetting(
      deepMerge(chatSetting, {
        mcpServers: {
          [newServerId]: {
            ...newServer,
            available: true,
          },
        },
        showAddServerForm: false,
      }) as ChatSetting,
    );

    setNewServer({
      name: '',
      type: 'remote',
      enabled: true,
      available: true,
      env: {},
    });

    await refreshMCPTools();
  };

  const toggleMcpServer = useCallback(
    (serverId: string) => {
      if (!chatSetting) {
        return;
      }

      setChatSetting(
        deepMerge(chatSetting, {
          mcpServers: mergeMCPServers(chatSetting, serverId, {
            enabled: !chatSetting.mcpServers[serverId].enabled,
          }),
        }),
      );
    },
    [chatSetting],
  );

  const removeMcpServer = useCallback(
    async (serverId: string) => {
      if (!chatSetting) {
        return;
      }

      setChatSetting({
        ...chatSetting,
        mcpServers: mergeMCPServers(chatSetting, serverId),
      });

      await refreshMCPTools();
    },
    [chatSetting],
  );

  const toggleAddServerForm = useCallback(() => {
    if (!chatSetting) {
      return;
    }

    setChatSetting(
      deepMerge(chatSetting, {
        showAddServerForm: !chatSetting.showAddServerForm,
      }) as ChatSetting,
    );
  }, [chatSetting]);

  const handleEnvFormSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      const formData = new FormData(e.target as HTMLFormElement);
      const key = (formData.get('env-key') as string)?.trim();
      const value = (formData.get('env-value') as string) || '';

      if (!key) {
        return;
      }

      if (!value && newServer.env?.[key]) {
        const newEnv = { ...newServer.env };
        delete newEnv[key];

        setNewServer({
          ...newServer,
          env: newEnv,
        });
      } else {
        setNewServer({
          ...newServer,
          env: {
            ...newServer.env,
            [key]: value,
          },
        });
      }

      (e.target as HTMLFormElement).reset();
    },
    [newServer],
  );

  const removeEnvironmentVariable = useCallback(
    (key: string) => {
      if (!newServer.env) return;

      const newEnv = { ...newServer.env };
      delete newEnv[key];

      setNewServer({
        ...newServer,
        env: newEnv,
      });
    },
    [newServer],
  );

  return (
    <div id="mcp-settings" className="space-y-4 overflow-y-auto pr-1 flex-1">
      {/* Add MCP Server UI */}
      <div className="border rounded-md mb-4">
        <button
          type="button"
          className="p-3 flex items-center justify-between cursor-pointer w-full text-left"
          onClick={() => toggleAddServerForm()}
        >
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add MCP Server
          </h4>
          <span className="h-6 w-6 p-0 flex items-center justify-center">
            {chatSetting?.showAddServerForm ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </button>
        {chatSetting?.showAddServerForm && (
          <div className="border-t p-3 space-y-3">
            <RadioGroup
              value={addServerMethod}
              onValueChange={(value) =>
                setAddServerMethod(value as 'import' | 'manual')
              }
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual">Add Manually</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="import" id="import" />
                <Label htmlFor="import">Import from JSON</Label>
              </div>
            </RadioGroup>
            {addServerMethod === 'import' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="server-json-file"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileJson className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-1 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span>{' '}
                        or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JSON file with MCP server configuration
                      </p>
                    </div>
                    <input
                      id="server-json-file"
                      type="file"
                      className="hidden"
                      accept=".json"
                      ref={fileInputRef}
                      onChange={handleFileImport}
                    />
                  </label>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Expected format:</p>
                  <pre className="mt-1 p-2 bg-muted rounded-md overflow-x-auto">
                    {`{
  "mcpServers": {
    "serverName": {
      "command": "npx",
      "args": ["-y", "package-name"]
    }
  }
}`}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Server Type */}
                <div>
                  <label
                    htmlFor="server-type"
                    className="text-xs font-medium block mb-1"
                  >
                    Server Type
                  </label>
                  <Select
                    value={newServer.type}
                    onValueChange={(value) =>
                      setNewServer({
                        ...newServer,
                        type: value as MCPServerType,
                      })
                    }
                  >
                    <SelectTrigger id="server-type" className="text-xs">
                      <SelectValue placeholder="Select server type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">
                        remote (Streamable or Server-Sent Events)
                      </SelectItem>
                      <SelectItem value="stdio">
                        stdio (Standard I/O)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Server Name */}
                <div>
                  <label
                    htmlFor="server-name"
                    className="text-xs font-medium block mb-1"
                  >
                    Server Name
                  </label>
                  <Input
                    id="server-name"
                    value={newServer.name || ''}
                    onChange={(e) =>
                      setNewServer({ ...newServer, name: e.target.value })
                    }
                    placeholder="My MCP Server"
                    className="text-xs"
                  />
                </div>
                {/* Server URL */}
                {newServer.type === 'remote' && (
                  <div>
                    <label
                      htmlFor="server-url"
                      className="text-xs font-medium block mb-1"
                    >
                      Server URL
                    </label>
                    <Input
                      id="server-url"
                      value={newServer.url || ''}
                      onChange={(e) =>
                        setNewServer({ ...newServer, url: e.target.value })
                      }
                      placeholder="https://mcp.example.com/mcp"
                      className="text-xs font-mono"
                    />
                  </div>
                )}
                {/* Command and Args for stdio */}
                {newServer.type === 'stdio' && (
                  <>
                    <div>
                      <label
                        htmlFor="server-command"
                        className="text-xs font-medium block mb-1"
                      >
                        Command
                      </label>
                      <Input
                        id="server-command"
                        value={newServer.command || ''}
                        onChange={(e) =>
                          setNewServer({
                            ...newServer,
                            command: e.target.value,
                          })
                        }
                        placeholder="npx"
                        className="text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="server-args"
                        className="text-xs font-medium block mb-1"
                      >
                        Arguments (comma-separated)
                      </label>
                      <Input
                        id="server-args"
                        value={newServer.args?.join(', ') || ''}
                        onChange={(e) =>
                          setNewServer({
                            ...newServer,
                            args: e.target.value
                              .split(',')
                              .map((arg) => arg.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="-y, package-name, run"
                        className="text-xs font-mono"
                      />
                    </div>
                  </>
                )}
                {/* Environment Variables */}
                <div>
                  <label
                    htmlFor="env"
                    className="text-xs font-medium block mb-1"
                  >
                    Environment Variables (optional)
                  </label>
                  {/* Display current environment variables */}
                  {newServer.env && Object.keys(newServer.env).length > 0 && (
                    <div className="mb-2 border rounded-md p-2 space-y-2">
                      {Object.entries(newServer.env).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex-1 truncate">
                            <span className="font-mono font-medium">
                              {key}=
                            </span>
                            <span className="font-mono">{value}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 text-muted-foreground hover:text-destructive"
                            onClick={() => removeEnvironmentVariable(key)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Add new environment variable */}
                  <div className="space-y-2">
                    <form onSubmit={handleEnvFormSubmit} className="flex gap-2">
                      <Input
                        id="env-key"
                        name="env-key"
                        placeholder="Key"
                        className="text-xs h-9 flex-1"
                      />
                      <Input
                        id="env-value"
                        name="env-value"
                        placeholder="Value"
                        className="text-xs font-mono h-9 flex-1"
                      />
                      <Button
                        type="submit"
                        variant="outline"
                        className="h-9 px-3"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </div>
                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={addMcpServerManually}
                    disabled={!isValidMCPConfig(newServer)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Server
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* MCP Server List */}
      <h4 className="text-sm font-medium">MCP Servers</h4>
      <div className="space-y-3">
        {Object.keys(chatSetting?.mcpServers || {}).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No MCP servers configured</p>
            <p className="text-xs">Add a server using the form above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(chatSetting?.mcpServers || {})
              .filter(([_, server]) => server.available)
              .map(([id, server]) => (
                <div
                  key={id}
                  className={`flex items-start justify-between bg-muted p-3 rounded-md}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{id}</div>
                      <Badge variant="outline" className="text-xs">
                        {server.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {server.type === 'stdio' && (
                        <>
                          <div className="font-mono">
                            $ {server.command} {server.args?.join(' ')}
                          </div>
                          {server.env && Object.keys(server.env).length > 0 && (
                            <div className="mt-1">
                              <span className="font-medium">Environment:</span>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 pl-2">
                                {Object.entries(server.env).map(
                                  ([key, value]) => (
                                    <div key={key} className="col-span-2 flex">
                                      <span className="font-mono font-medium">
                                        {key}=
                                      </span>
                                      <span className="font-mono truncate">
                                        {value}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      {server.type === 'remote' && (
                        <div className="font-mono truncate max-w-[280px]">
                          {server.url}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={server.enabled}
                        onCheckedChange={() => toggleMcpServer(id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeMcpServer(id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

function isValidMCPConfig(config: MCPServerConfig) {
  try {
    if (!config.name) {
      return false;
    }
    if (!config.type || !['remote', 'stdio'].includes(config.type)) {
      return false;
    }
    if (config.type === 'remote') {
      return !!config.url && new URL(config.url).protocol.startsWith('http');
    }
    if (config.type === 'stdio') {
      return !!config.command && Array.isArray(config.args);
    }
  } catch {}

  return false;
}

function readMCPServersConfigFile(
  file: File,
): Promise<Record<string, MCPServerConfig>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = JSON.parse(event.target?.result as string) as Record<
          string,
          MCPServerConfig
        >;

        if (!content.mcpServers || typeof content.mcpServers !== 'object') {
          reject(
            new Error('Invalid JSON format: mcpServers should be an object'),
          );
        }

        const mcpServers: Record<string, MCPServerConfig> = {};
        Object.entries(content.mcpServers).forEach(
          ([serverId, serverConfig]) => {
            const server: MCPServerConfig = {
              ...serverConfig,
              name: serverConfig?.name ?? serverId,
              type: serverConfig?.url ? 'remote' : 'stdio',
              enabled: true,
              available: true,
            };

            mcpServers[serverId] = server;
          },
        );

        resolve(mcpServers);
      } catch (error) {
        reject(
          new Error('Failed to parse JSON file. Please check the file format.'),
        );
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function mergeMCPServers(
  chatSetting: ChatSetting,
  serverId: string,
  mcpServer?: Partial<MCPServerConfig>,
): Record<string, MCPServerConfig> {
  if (mcpServer) {
    return {
      ...chatSetting.mcpServers,
      [serverId]: deepMerge(
        chatSetting?.mcpServers[serverId],
        mcpServer,
      ) as MCPServerConfig,
    };
  } else {
    const mcpServers = { ...chatSetting.mcpServers };
    delete mcpServers[serverId];

    return mcpServers;
  }
}
