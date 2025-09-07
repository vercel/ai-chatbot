# Configuração Global de Servidores MCP

## Visão Geral
Este documento explica como configurar servidores MCP (Model Context Protocol) de forma global no Claude Code, permitindo que funcionem em qualquer projeto sem necessidade de reconfiguração.

## Servidores MCP Configurados

### 1. **Exa** ✅
- **Tipo**: HTTP (externo)
- **URL**: `https://server.smithery.ai/exa/mcp`
- **Função**: Busca avançada na web
- **Status**: Sempre conectado

### 2. **Ruv-Swarm** ✅
- **Tipo**: STDIO (local)
- **Comando**: `npx ruv-swarm mcp start`
- **Função**: Coordenação de agentes em swarm
- **Status**: Conecta sob demanda

### 3. **Flow-Nexus** ✅
- **Tipo**: STDIO (local)
- **Comando**: `npx flow-nexus@latest mcp start`
- **Função**: Orquestração avançada com 70+ ferramentas
- **Status**: Conecta sob demanda

## Como Foi Configurado

### Passo 1: Posicionar no Diretório Raiz do Claude
```bash
cd /root/.claude
```
**Importante**: A configuração global deve ser feita no diretório raiz do Claude, não em projetos específicos.

### Passo 2: Adicionar Servidores MCP

#### Adicionar Ruv-Swarm
```bash
claude mcp add ruv-swarm "npx" "ruv-swarm" "mcp" "start"
```

#### Adicionar Flow-Nexus
```bash
claude mcp add flow-nexus "npx" "flow-nexus@latest" "mcp" "start"
```

**Nota**: Os argumentos devem ser passados separadamente, não como string única.

### Passo 3: Verificar Configuração
```bash
claude mcp list
```

Saída esperada:
```
Checking MCP server health...

exa: https://server.smithery.ai/exa/mcp (HTTP) - ✓ Connected
ruv-swarm: npx ruv-swarm mcp start - ✓ Connected
flow-nexus: npx flow-nexus@latest mcp start - ✓ Connected
```

## Resolução de Problemas

### Problema: "Failed to connect"
Se aparecer "Failed to connect" inicialmente, é normal. Os servidores STDIO conectam sob demanda.

#### Solução se persistir:
1. Remover configuração incorreta:
```bash
claude mcp remove ruv-swarm -s local
claude mcp remove flow-nexus -s local
```

2. Readicionar com sintaxe correta:
```bash
claude mcp add ruv-swarm "npx" "ruv-swarm" "mcp" "start"
claude mcp add flow-nexus "npx" "flow-nexus@latest" "mcp" "start"
```

### Problema: Servidor aparece em múltiplos escopos
```bash
# Remover de escopo específico
claude mcp remove "nome-servidor" -s local   # Remove do escopo local
claude mcp remove "nome-servidor" -s project # Remove do escopo do projeto
```

## Estrutura de Configuração

Os servidores MCP são salvos em `/root/.claude.json`:

```json
{
  "projects": {
    "/root/.claude": {
      "mcpServers": {
        "exa": {
          "type": "http",
          "url": "https://server.smithery.ai/exa/mcp"
        },
        "ruv-swarm": {
          "type": "stdio",
          "command": "npx",
          "args": ["ruv-swarm", "mcp", "start"],
          "env": {}
        },
        "flow-nexus": {
          "type": "stdio",
          "command": "npx",
          "args": ["flow-nexus@latest", "mcp", "start"],
          "env": {}
        }
      }
    }
  }
}
```

## Verificação de Funcionamento

### Testar em Qualquer Projeto
```bash
cd /qualquer/projeto
claude mcp list
```

Os servidores globais devem aparecer disponíveis.

### Usar Ferramentas MCP
As ferramentas estão disponíveis com o prefixo `mcp__`:
- `mcp__exa__*` - Ferramentas de busca
- `mcp__ruv-swarm__*` - Ferramentas de swarm
- `mcp__flow-nexus__*` - Ferramentas de orquestração

## Benefícios da Configuração Global

1. **Reutilização**: Funciona em todos os projetos
2. **Manutenção Única**: Atualizar em um lugar afeta todos os projetos
3. **Consistência**: Mesmas ferramentas disponíveis sempre
4. **Economia de Tempo**: Não precisa configurar por projeto

## Comandos Úteis

```bash
# Listar servidores MCP
claude mcp list

# Adicionar novo servidor global
cd /root/.claude
claude mcp add <nome> <comando> [args...]

# Remover servidor
claude mcp remove <nome>

# Ver detalhes de um servidor
claude mcp get <nome>

# Resetar configurações de projeto
claude mcp reset-project-choices
```

## Notas Importantes

- **Configuração Global**: Sempre faça em `/root/.claude`
- **Argumentos Separados**: Use aspas para cada argumento separadamente
- **Lazy Loading**: Servidores STDIO conectam quando usados
- **Persistência**: Configurações são salvas em `/root/.claude.json`

## Requisitos

- Node.js 20+ (para Flow-Nexus e Ruv-Swarm)
- Claude Code CLI instalado
- NPM/NPX disponível no PATH

---

*Última atualização: 07/09/2025*
*Configuração testada e funcionando com Claude Code no Docker Ubuntu*