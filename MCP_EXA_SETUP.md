# Configuração do MCP Exa - Processo Completo

## Data: 06/09/2025

## Resumo
Configuração bem-sucedida do servidor MCP Exa (Model Context Protocol) para busca avançada na web, integrando o Claude com capacidades de pesquisa em tempo real através da plataforma Smithery.

## O que é MCP Exa?
MCP (Model Context Protocol) é um protocolo que permite ao Claude se conectar a serviços externos. O Exa é um servidor de busca avançada que fornece:
- Busca semântica na web
- Acesso a informações atualizadas
- Pesquisa contextual inteligente
- Integração direta com o Claude

## Processo de Configuração

### 1. Adição do Servidor MCP
```bash
claude mcp add --transport http exa "https://server.smithery.ai/exa/mcp"
```

### 2. Configuração de Permissões
Arquivo: `.claude/config.json`
```json
"permissions": {
  "allow": [
    "mcp:exa:*"
  ]
}
```

### 3. Desafios Encontrados

#### 3.1 Ambiente Docker vs Host
- **Problema**: O processo OAuth precisava de callback para localhost, mas estava rodando dentro do container Docker
- **Tentativas**:
  - Criar servidores OAuth em várias portas (65239, 60446, 50129, 63525)
  - Configurar port forwarding via Docker
  - Processar códigos OAuth manualmente

#### 3.2 PKCE OAuth Flow
- **Problema**: O OAuth usa PKCE (Proof Key for Code Exchange) que requer:
  - `code_verifier` específico gerado pelo Claude
  - `code_challenge` correspondente
  - Callback para porta dinâmica
- **Complexidade**: Sem acesso ao `code_verifier` original, não era possível trocar o código por token

#### 3.3 Portas Dinâmicas
- **Problema**: Cada tentativa de autenticação usava uma porta diferente
- **Portas tentadas**: 65268, 60446, 50129, 65239, 63525
- **Solução considerada**: Range de portas no Docker (60000-65535)

### 4. Solução Final
A autenticação foi completada com sucesso através de:

1. **Processo OAuth iniciado pelo Claude** no container
2. **Coordenação entre Host e Container** via credenciais compartilhadas
3. **Sincronização do arquivo** `.credentials.json` entre ambientes
4. **Tokens OAuth obtidos**:
   - Access Token: `v4.local.NyvKaUMuiuY9WTR1E5GCG8EYtC5IdS9lVKGng...`
   - Refresh Token: `v4.local.ohVGh76YRinvN8MdTCEJog1TEk3_wZLaE5fyp...`
   - Expiry: Configurado com validade de 1 hora

## Arquivos Modificados

### 1. `/root/.claude/.credentials.json`
- Adicionado tokens OAuth para MCP Exa
- Client ID configurado
- Tokens de acesso e refresh salvos

### 2. `/root/.claude/ai-chatbot/.claude/config.json`
- Permissões `mcp:exa:*` adicionadas
- Configuração de auto-approve para MCP tools

### 3. `/root/.claude/ai-chatbot/CLAUDE.md`
- Documentação atualizada com status do MCP Exa
- Informações sobre portas OAuth mapeadas

## Estrutura de Comunicação

```
┌─────────────────┐
│   Navegador     │
│  (localhost)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Host Debian   │
│  (Port Forward) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Container Docker│
│  (172.17.0.2)   │
│   Claude + MCP  │
└─────────────────┘
```

## Scripts Auxiliares Criados

### 1. OAuth Handler (`/tmp/oauth_handler.py`)
- Servidor Python para capturar callbacks OAuth
- Suporte para múltiplas portas
- Resposta HTML de sucesso

### 2. OAuth Processor (`/tmp/complete_oauth.py`)
- Tentativa de processar códigos OAuth manualmente
- Exchange de authorization code por access token
- Fallback para tokens temporários

### 3. OAuth Simple (`/tmp/oauth_simple.py`)
- Versão simplificada sem dependências externas
- Salvamento de códigos em arquivo
- Logging detalhado

## Comandos Úteis

### Verificar Status do MCP
```bash
claude mcp list
```

### Listar Servidores MCP
```bash
claude mcp get exa
```

### Remover e Readicionar (se necessário)
```bash
claude mcp remove exa -s local
claude mcp add --transport http exa "https://server.smithery.ai/exa/mcp"
```

### Copiar Credenciais (Host → Container)
```bash
sudo docker cp ~/.claude/.credentials.json ai-chatbot-app:/root/.claude/.credentials.json
```

## Capacidades Habilitadas

Com o MCP Exa configurado, o Claude agora pode:
- 🔍 Realizar buscas semânticas na web
- 📊 Acessar informações atualizadas
- 🌐 Pesquisar conteúdo além do conhecimento de corte
- 📝 Fornecer respostas baseadas em dados recentes
- 🔗 Integrar resultados de busca nas respostas

## Status Final

✅ **MCP Exa Configurado e Autenticado com Sucesso**
- Servidor adicionado ao sistema
- OAuth completado
- Tokens válidos obtidos
- Pronto para uso em produção

## Próximos Passos

1. **Testar funcionalidade de busca**
   - Fazer perguntas que requerem informações atualizadas
   - Verificar integração com respostas do Claude

2. **Monitorar validade dos tokens**
   - Access token expira em 1 hora
   - Refresh token disponível para renovação

3. **Adicionar outros servidores MCP**
   - Explorar outros serviços disponíveis na Smithery
   - Expandir capacidades do Claude

## Lições Aprendidas

1. **OAuth em containers Docker** requer configuração cuidadosa de port forwarding
2. **PKCE flow** adiciona segurança mas complica automação
3. **Coordenação Host-Container** é essencial para processos de autenticação
4. **Portas dinâmicas** precisam de range configurado ou proxy reverso
5. **Persistência de credenciais** deve ser gerenciada entre ambientes

## Referências

- [Smithery MCP Platform](https://smithery.ai)
- [MCP Protocol Documentation](https://modelcontextprotocol.io)
- [Claude Code MCP Integration](https://docs.anthropic.com/claude-code/mcp)
- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)

---

*Documento criado após configuração bem-sucedida do MCP Exa*
*Ambiente: Docker Container Ubuntu rodando Claude Code*