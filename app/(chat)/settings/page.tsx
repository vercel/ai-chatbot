"use client";

import { useState, useEffect, useTransition } from 'react';
import {
  fetchMcpServers,
  addMcpServerAction,
  toggleMcpServerAction,
  deleteMcpServerAction,
} from '@/app/(chat)/actions';
import type { McpServer } from '@/lib/db/schema'; // Assuming schema path
import { experimental_createMCPClient } from 'ai';

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal, PlugZap, RefreshCw, Wrench } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

// Define type for tool schema
type ToolSchema = {
  name: string;
  description: string;
  parameters?: Record<string, any>;
};

// Define transport types from MCP client
type SSEConfig = {
  type: 'sse';
  url: string;
};

type StdioMCPTransport = {
  type: 'stdio';
  command: string;
  args?: string[];
};

type MCPTransport = SSEConfig | StdioMCPTransport;

export default function Page() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [serverSchemas, setServerSchemas] = useState<Record<string, ToolSchema[]>>({});
  const [schemaLoading, setSchemaLoading] = useState<Record<string, boolean>>({});

  // Form state for adding a server
  const [newName, setNewName] = useState('');
  const [newTransportType, setNewTransportType] = useState<'sse' | 'stdio'>('sse');
  const [newUrl, setNewUrl] = useState('');
  const [newCommand, setNewCommand] = useState('');
  const [newArgs, setNewArgs] = useState('');
  // Add state for headers if needed

  useEffect(() => {
    const loadServers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedServers = await fetchMcpServers();
        setServers(fetchedServers);

        // Initialize schema loading state for all servers
        const initialSchemaLoading: Record<string, boolean> = {};
        fetchedServers.forEach((server) => {
          initialSchemaLoading[server.id] = false;
        });
        setSchemaLoading(initialSchemaLoading);

        // Fetch schemas for all enabled servers
        fetchedServers
          .filter((server) => server.isEnabled)
          .forEach((server) => {
            fetchServerSchema(server);
          });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load servers');
      } finally {
        setIsLoading(false);
      }
    };
    loadServers();
  }, []);

  const fetchServerSchema = async (server: McpServer) => {
    setSchemaLoading((prev) => ({ ...prev, [server.id]: true }));
    setError(null); // Clear previous errors specific to this server
    try {
      // Create MCP client based on server config
      const config = server.config as any;
      let clientOptions: { transport: any; name: string };

      if (!config || typeof config !== 'object') {
        throw new Error("Server configuration is missing or invalid.");
      }

      if (config.transportType === 'sse') {
        if (!config.url || typeof config.url !== 'string') {
          console.error("Invalid SSE config for server", server.id, config);
          throw new Error("Invalid SSE configuration: URL is missing or not a string.");
        }
        clientOptions = {
          transport: {
            type: 'sse',
            url: config.url
          },
          name: server.name
        };
      } else if (config.transportType === 'stdio') {
        if (!config.command || typeof config.command !== 'string') {
          console.error("Invalid stdio config for server", server.id, config);
          throw new Error("Invalid stdio configuration: Command is missing or not a string.");
        }
        // Ensure args is an array of strings, defaulting to empty array
        const args = config.args && Array.isArray(config.args)
          ? config.args.filter((arg: any): arg is string => typeof arg === 'string')
          : [];

        clientOptions = {
          transport: {
            type: 'stdio',
            command: config.command,
            args: args
          },
          name: server.name
        };
      } else {
        console.error("Unsupported transport type for server", server.id, config.transportType);
        throw new Error(`Unsupported transport type: ${config.transportType}`);
      }

      console.log('Attempting to create MCP Client with options:', JSON.stringify(clientOptions, null, 2));

      const client = await experimental_createMCPClient(clientOptions);

      try {
        // Get tools from the MCP server
        const toolSet = await client.tools();

        // Extract tool schemas
        const schemas: ToolSchema[] = Object.entries(toolSet).map(([name, tool]: [string, any]) => ({
          name,
          description: tool.description || 'No description available',
          parameters: tool.parameters || {}
        }));

        setServerSchemas((prev) => ({ ...prev, [server.id]: schemas }));
      } finally {
        // Always close the client
        await client.close();
      }
    } catch (err) {
      console.error(`Failed to fetch schema for ${server.name} (ID: ${server.id}):`, err);
      // Set specific error for this server card
      setError(`Failed to refresh schema for ${server.name}: ${err instanceof Error ? err.message : String(err)}`);
      setServerSchemas((prev) => ({ ...prev, [server.id]: [] })); // Clear schema on error
    } finally {
      setSchemaLoading((prev) => ({ ...prev, [server.id]: false }));
    }
  };

  const handleRefreshSchema = (server: McpServer) => {
    if (!server.isEnabled) return;
    fetchServerSchema(server);
  };

  const handleAddServer = async (e: React.FormEvent) => {
     e.preventDefault();
    setError(null); // Clear previous errors

    let config: Record<string, any> = { transportType: newTransportType };
    if (newTransportType === 'sse') {
        if (!newUrl) {
            setError("URL is required for SSE transport.");
            return;
        }
      config.url = newUrl;
      // Add headers to config if implemented
    } else { // stdio
      if (!newCommand) {
         setError("Command is required for stdio transport.");
         return;
      }
      config.command = newCommand;
      config.args = newArgs.split(' ').filter(Boolean); // Basic space splitting for args
    }

    startTransition(async () => {
      try {
        const result = await addMcpServerAction({ name: newName, config });
        if (result?.success && result.server) {
          const newServer = result.server as McpServer;
          setServers((prev) => [...prev, newServer]);

          // Initialize schema loading state for the new server
          setSchemaLoading((prev) => ({ ...prev, [newServer.id]: false }));

          // Fetch schema if the server is enabled
          if (newServer.isEnabled) {
            fetchServerSchema(newServer);
          }

          setIsAddDialogOpen(false);
          // Reset form
          setNewName('');
          setNewTransportType('sse');
          setNewUrl('');
          setNewCommand('');
          setNewArgs('');
        } else {
          setError(result?.error || 'Failed to add server');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    });
  };

  const handleToggleServer = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
       setError(null);
      try {
         const result = await toggleMcpServerAction({ id, isEnabled: !currentStatus });
         if (result?.success && result.server) {
            setServers((prev) =>
              prev.map((s) => (s.id === id ? { ...s, isEnabled: result.server.isEnabled } : s))
            );

            // Fetch schema if server was enabled
            if (result.server.isEnabled) {
              const server = servers.find(s => s.id === id);
              if (server) {
                fetchServerSchema({...server, isEnabled: true});
              }
            }
         } else {
             setError(result?.error || 'Failed to toggle server status');
         }
      } catch (err) {
         setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      }
    });
  };

  const handleDeleteServer = (id: string) => {
    if (!confirm('Are you sure you want to delete this MCP server?')) return;
    startTransition(async () => {
       setError(null);
       try {
           const result = await deleteMcpServerAction({ id });
           if (result?.success) {
              setServers((prev) => prev.filter((s) => s.id !== id));
              // Remove schema for the deleted server
              setServerSchemas((prev) => {
                const newSchemas = {...prev};
                delete newSchemas[id];
                return newSchemas;
              });
              setSchemaLoading((prev) => {
                const newLoading = {...prev};
                delete newLoading[id];
                return newLoading;
              });
           } else {
               setError(result?.error || 'Failed to delete server');
           }
       } catch (err) {
           setError(err instanceof Error ? err.message : 'An unexpected error occurred');
       }
    });
  };

  return (
    <div className="p-4 md:p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">MCP Servers</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isPending}>Add New Server</Button>
          </DialogTrigger>
        </Dialog>
      </div>

       {error && <p className="text-red-500 mb-4">Error: {error}</p>}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
             <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
                <CardFooter className="justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-20" />
                  </div>
                   <Skeleton className="h-9 w-20" />
                </CardFooter>
             </Card>
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center">
          <PlugZap className="size-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No MCP Servers Configured</h3>
          <p className="text-muted-foreground mt-1">
            Add your first MCP server to connect external tools.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {servers.map((server) => (
            <Card key={server.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{server.name}</CardTitle>
                  {server.isEnabled && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRefreshSchema(server)}
                      disabled={schemaLoading[server.id]}
                    >
                      <RefreshCw className={`size-4 mr-2 ${schemaLoading[server.id] ? 'animate-spin' : ''}`} />
                      Refresh Schema
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                 <p className="text-sm text-muted-foreground">ID: {server.id}</p>
                 <p className="text-sm text-muted-foreground">Type: {(server.config as any)?.transportType || 'N/A'}</p>
                 {(server.config as any)?.transportType === 'sse' && <p className="text-sm text-muted-foreground">URL: {(server.config as any)?.url}</p>}
                 {(server.config as any)?.transportType === 'stdio' && <p className="text-sm text-muted-foreground">Command: {(server.config as any)?.command} {(server.config as any)?.args?.join(' ')}</p>}

                 {/* Tool Schema Section */}
                 {server.isEnabled && (
                   <div className="mt-4">
                     <div className="flex items-center mb-2">
                       <Wrench className="size-4 mr-2" />
                       <h4 className="font-medium">Available Tools</h4>
                     </div>

                     {schemaLoading[server.id] ? (
                       <div className="space-y-2">
                         <Skeleton className="h-8 w-full" />
                         <Skeleton className="h-8 w-full" />
                       </div>
                     ) : serverSchemas[server.id]?.length ? (
                       <Accordion type="multiple" className="w-full">
                         {serverSchemas[server.id].map((tool) => (
                           <AccordionItem key={tool.name} value={tool.name}>
                             <AccordionTrigger className="text-sm">
                               <div className="flex items-center">
                                 <Badge variant="outline" className="mr-2">{tool.name}</Badge>
                               </div>
                             </AccordionTrigger>
                             <AccordionContent>
                               <div className="text-sm">
                                 <p className="mb-1 text-muted-foreground">{tool.description}</p>
                                 {Object.keys(tool.parameters || {}).length > 0 && (
                                   <div className="mt-2">
                                     <span className="text-xs font-medium">Parameters:</span>
                                     <pre className="mt-1 p-2 bg-muted rounded-md text-xs overflow-auto">
                                       {JSON.stringify(tool.parameters, null, 2)}
                                     </pre>
                                   </div>
                                 )}
                               </div>
                             </AccordionContent>
                           </AccordionItem>
                         ))}
                       </Accordion>
                     ) : (
                       <p className="text-sm text-muted-foreground italic">
                         {server.isEnabled
                           ? "No tools available or unable to connect to server"
                           : "Enable the server to view available tools"}
                       </p>
                     )}
                   </div>
                 )}
              </CardContent>
              <CardFooter className="justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`switch-${server.id}`} className="mr-2">Enabled</Label>
                   <Switch
                      id={`switch-${server.id}`}
                      checked={server.isEnabled}
                      onCheckedChange={() => handleToggleServer(server.id, server.isEnabled)}
                      disabled={isPending}
                   />
                </div>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteServer(server.id)}
                  disabled={isPending}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
                 <DialogTitle>Add New MCP Server</DialogTitle>
             </DialogHeader>
             <form onSubmit={handleAddServer}>
                 <div className="grid gap-4 py-4">
                    <div className="space-y-1">
                       <Label htmlFor="server-name">Server Name</Label>
                       <Input
                         id="server-name"
                         value={newName}
                         onChange={(e) => setNewName(e.target.value)}
                         placeholder="My Custom Tools"
                         required
                         disabled={isPending}
                       />
                    </div>

                    <div className="space-y-1">
                       <Label htmlFor="transport-type">Transport Type</Label>
                       <Select
                         value={newTransportType}
                         onValueChange={(value: 'sse' | 'stdio') => setNewTransportType(value)}
                         disabled={isPending}
                       >
                         <SelectTrigger>
                             <SelectValue placeholder="Select transport type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sse">SSE (HTTP)</SelectItem>
                            <SelectItem value="stdio">Stdio (Local Command)</SelectItem>
                          </SelectContent>
                        </Select>
                     </div>

                     {newTransportType === 'sse' && (
                       <div className="space-y-1">
                         <Label htmlFor="server-url">Server URL</Label>
                         <Input
                           id="server-url"
                           type="url"
                           value={newUrl}
                           onChange={(e) => setNewUrl(e.target.value)}
                           placeholder="https://my-mcp-server.com/sse"
                           required
                           disabled={isPending}
                         />
                       </div>
                     )}

                     {newTransportType === 'stdio' && (
                       <>
                         <Alert variant="destructive" className="my-2">
                            <Terminal className="size-4" />
                            <AlertTitle>Security Warning</AlertTitle>
                            <AlertDescription>
                              Running local commands (stdio) from a web server can be insecure.
                              Ensure the command is safe and consider sandboxing if possible.
                            </AlertDescription>
                          </Alert>
                          <div className="space-y-1">
                             <Label htmlFor="server-command">Command</Label>
                             <Input
                               id="server-command"
                               value={newCommand}
                               onChange={(e) => setNewCommand(e.target.value)}
                               placeholder="node"
                               required
                               disabled={isPending}
                             />
                          </div>
                          <div className="space-y-1">
                             <Label htmlFor="server-args">Arguments</Label>
                             <Input
                               id="server-args"
                               value={newArgs}
                               onChange={(e) => setNewArgs(e.target.value)}
                               placeholder="dist/my-mcp-server.js (space-separated)"
                               disabled={isPending}
                             />
                          </div>
                       </>
                     )}
                  </div>
                  <DialogFooter>
                     <DialogClose asChild>
                         <Button type="button" variant="ghost" disabled={isPending}>Cancel</Button>
                     </DialogClose>
                     <Button type="submit" disabled={isPending || (newTransportType === 'sse' && !newUrl) || (newTransportType === 'stdio' && !newCommand)}>
                        {isPending ? 'Adding...' : 'Add Server'}
                     </Button>
                  </DialogFooter>
             </form>
          </DialogContent>
      </Dialog>
    </div>
  );
}
