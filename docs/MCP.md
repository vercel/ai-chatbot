# MCP (Model Context Protocol) Integration

This project supports connecting to MCP servers using VS Code-compatible configuration.

## Setup

1. Copy the example configuration:
```bash
cp mcp.json.example mcp.json
```

2. Edit `mcp.json` to configure your MCP servers:
```json
{
  "servers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
      },
      "type": "stdio"
    }
  },
  "inputs": [
    {
      "id": "github_token",
      "type": "promptString",
      "description": "GitHub Personal Access Token",
      "password": true
    }
  ]
}
```

3. Set input values in your application code before connecting to servers.

## Usage

### Server-side

```typescript
import { MCPClientManager, loadMCPConfig } from "@/lib/mcp";

// Load configuration
const config = await loadMCPConfig("mcp.json");

// Create manager
const mcpManager = new MCPClientManager(config);

// Set input values (e.g., from user prompts or environment)
mcpManager.setInputValue("github_token", process.env.GITHUB_TOKEN);

// Connect to a server
await mcpManager.connect("github");

// Get all tools from connected servers
const tools = await mcpManager.getAllTools();

// Use tools with AI SDK
import { generateText } from "ai";

const result = await generateText({
  model: yourModel,
  prompt: "List my GitHub repositories",
  tools,
});
```

### Client-side

Dynamic tools from MCP servers are automatically rendered in the chat UI using the `DynamicToolRenderer` component.

## Supported Transports

**Currently supported (beta):**
- `http`: HTTP transport for remote MCP servers
- `sse`: Server-Sent Events transport

**Coming in AI SDK 6 stable:**
- `stdio`: Local process communication (Docker, npx, Node.js)

### HTTP Transport Example
```json
{
  "servers": {
    "my-server": {
      "url": "https://your-mcp-server.com/mcp",
      "env": {
        "Authorization": "Bearer ${input:api_token}"
      },
      "type": "http"
    }
  }
}
```

### stdio Transport (Future)
Once AI SDK 6 stable is released with full stdio support:
```json
{
  "servers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "ghcr.io/github/github-mcp-server"],
      "type": "stdio"
    }
  }
}
```

## Configuration Format

The configuration format is compatible with VS Code's MCP settings:

- `servers`: Object mapping server names to configurations
  - `command`: Command to execute (e.g., "docker", "npx", "node")
  - `args`: Array of command arguments
  - `env`: Optional environment variables (supports `${input:id}` substitution)
  - `type`: Transport type ("stdio")

- `inputs`: Optional array of input prompts
  - `id`: Unique identifier referenced in env vars
  - `type`: Input type ("promptString")
  - `description`: Human-readable description
  - `password`: Whether to hide input (boolean)

## Examples

### Filesystem MCP Server
```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"],
      "type": "stdio"
    }
  }
}
```

### Multiple Servers
```json
{
  "servers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${input:github_token}"
      },
      "type": "stdio"
    },
    "database": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "${input:db_url}"
      },
      "type": "stdio"
    }
  },
  "inputs": [
    {
      "id": "github_token",
      "type": "promptString",
      "description": "GitHub Personal Access Token",
      "password": true
    },
    {
      "id": "db_url",
      "type": "promptString",
      "description": "Database Connection URL",
      "password": true
    }
  ]
}
```

## Security Notes

- Never commit `mcp.json` with actual tokens/credentials
- Use environment variables or secure input prompts for sensitive data
- The `mcp.json` file is automatically ignored by git
