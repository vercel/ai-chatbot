# Implementação Claude SDK - Documentação Técnica

## Visão Geral da Integração

Este documento detalha a implementação da integração com Claude Code SDK no projeto AI Chatbot, incluindo a evolução da solução e decisões técnicas tomadas.

## Histórico de Implementação

### Versão 1: Python SDK (Descontinuada)
```python
# Tentativa inicial usando SDK Python
result = subprocess.run(
    ['python3', '-c', python_code],
    capture_output=True,
    text=True
)
```
**Problema**: Dependência do SDK Python não instalado, erro `spawn python3 ENOENT`

### Versão 2: Claude CLI com Echo (Problemas de Escape)
```typescript
// Tentativa com echo direto
const claudeProcess = spawn('bash', [
  '-c', 
  `echo "${escapedContent}" | CI=true NONINTERACTIVE=1 claude -p`
]);
```
**Problema**: Caracteres especiais causavam problemas de escape

### Versão 3: Claude CLI com Arquivo (Implementada)
```typescript
// Solução atual usando arquivo temporário
const tmpFile = `/tmp/claude-input-${Date.now()}.txt`;
fs.writeFileSync(tmpFile, userContent);
const claudeProcess = spawn('bash', [
  '-c', 
  `CI=true NONINTERACTIVE=1 timeout 30 claude -p < "${tmpFile}" 2>&1; rm -f "${tmpFile}"`
]);
```
**Solução**: Uso direto do Claude CLI com input via arquivo temporário

## Implementação Atual

### 1. API Route Handler
**Arquivo**: `/app/api/claude/sdk/route.ts`

#### Fluxo de Processamento
```typescript
// 1. Recebe mensagens do cliente
const { messages, sessionId } = await req.json();

// 2. Prepara conteúdo para Claude
const userContent = messages
  .filter(m => m.role === 'user')
  .map(m => m.content)
  .join('\n\n');

// 3. Cria arquivo temporário (evita problemas de escape)
const tmpFile = `/tmp/claude-input-${Date.now()}.txt`;
fs.writeFileSync(tmpFile, userContent);

// 4. Executa Claude CLI
const claudeProcess = spawn('bash', ['-c', command]);

// 5. Stream resposta via SSE
const encoder = new TextEncoder();
const stream = new ReadableStream({
  async start(controller) {
    // Processa output do Claude
    claudeProcess.stdout.on('data', (data) => {
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({
          type: 'text_chunk',
          content: data.toString()
        })}\n\n`
      ));
    });
  }
});
```

### 2. Variáveis de Ambiente Críticas
```bash
CI=true              # Modo não-interativo
NONINTERACTIVE=1     # Evita prompts
timeout 30           # Limite de tempo (30s)
```

### 3. Tratamento de Erros

#### Timeout
```typescript
// Timeout de 30 segundos para evitar travamentos
`timeout 30 claude -p < "${tmpFile}"`
```

#### Limpeza de Recursos
```typescript
// Sempre remove arquivo temporário
`... 2>&1; rm -f "${tmpFile}"`
```

#### Error Handling
```typescript
claudeProcess.stderr.on('data', (data) => {
  console.error('Claude stderr:', data.toString());
  if (!headersSent) {
    controller.enqueue(encoder.encode(
      `data: ${JSON.stringify({
        type: 'error',
        message: 'Erro ao processar com Claude'
      })}\n\n`
    ));
  }
});
```

## Detecção de Ferramentas

### 1. Detecção Automática no Frontend
**Arquivo**: `/components/chat/GenerativeChat.tsx`

```typescript
// Detecta solicitações de clima
if (lowerInput.includes('clima') || 
    lowerInput.includes('tempo') || 
    lowerInput.includes('weather')) {
  const cityMatch = input.match(/(?:em|in|de|para)\s+([A-Za-zÀ-ÿ\s]+?)(?:\?|$|,)/i);
  if (cityMatch) {
    autoTool = { name: 'getWeather', args: cityMatch[1].trim() };
  }
}
```

### 2. Protocolo de Comunicação de Tools
```typescript
// Claude retorna comando TOOL
"TOOL:getWeather:São Paulo"

// Frontend detecta e executa
const toolMatch = assistantContent.match(/TOOL:(\w+):(.+?)(?:\n|$)/);
if (toolMatch) {
  const result = await executeTool(toolMatch[1], toolMatch[2]);
}
```

## Streaming e SSE

### 1. Configuração do Stream
```typescript
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  },
});
```

### 2. Formato de Mensagens SSE
```typescript
// Chunk de texto
data: {"type":"text_chunk","content":"Resposta do Claude"}

// Erro
data: {"type":"error","message":"Mensagem de erro"}

// Session ID
data: {"type":"session","session_id":"uuid"}
```

## Otimizações Implementadas

### 1. Input via Arquivo
**Problema**: Caracteres especiais e escape em shell
**Solução**: Escrever input em arquivo temporário
```typescript
fs.writeFileSync(tmpFile, userContent);
// Uso: claude -p < "${tmpFile}"
```

### 2. Logging Detalhado
```typescript
console.log('=== Claude SDK Debug ===');
console.log('User content:', userContent);
console.log('Command:', command);
console.log('Working directory:', process.cwd());
console.log('========================');
```

### 3. Gestão de Sessão
```typescript
// Mantém contexto entre mensagens
const sessionId = req.headers.get('x-session-id') || 
                 `session-${Date.now()}`;
```

## Problemas Resolvidos

### 1. Erro "spawn python3 ENOENT"
**Causa**: Tentativa de usar Python SDK não instalado
**Solução**: Migração para Claude CLI nativo

### 2. Timeout em Respostas Longas
**Causa**: Timeout padrão muito baixo (10s)
**Solução**: Aumentado para 30s

### 3. Erro 500 em Autenticação
**Causa**: AUTH_SECRET não configurado
**Solução**: Geração e configuração em .env
```bash
openssl rand -base64 32 > AUTH_SECRET
```

### 4. Caracteres Especiais no Input
**Causa**: Problemas de escape no shell
**Solução**: Input via arquivo temporário

## Testes e Validação

### Comandos de Teste
```bash
# Teste direto do Claude CLI
echo "Olá" | CI=true NONINTERACTIVE=1 claude -p

# Teste da API
curl -X POST http://localhost:3000/api/claude/sdk \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Olá"}]}'
```

### Verificação de Logs
```bash
# Logs do servidor Next.js
npm run dev

# Logs do Docker
docker logs ai-chatbot-app -f

# Console do navegador
// Verificar Network tab e Console
```

## Melhorias Futuras

### 1. Cache de Respostas
```typescript
// Implementar cache Redis/Memory
const cacheKey = hash(messages);
const cached = await cache.get(cacheKey);
if (cached) return cached;
```

### 2. Rate Limiting
```typescript
// Limitar requisições por usuário
const rateLimit = new RateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10 // 10 requisições
});
```

### 3. Contexto Persistente
```typescript
// Salvar histórico em banco de dados
await db.conversation.create({
  sessionId,
  messages,
  timestamp: new Date()
});
```

### 4. Métricas e Monitoring
```typescript
// Tracking de performance
const startTime = Date.now();
// ... processamento
const duration = Date.now() - startTime;
metrics.record('claude.response.time', duration);
```

## Arquivos Principais

### Estrutura Atual:
```
/root/.claude/ai-chatbot/
├── app/
│   └── api/
│       └── claude/
│           └── sdk/
│               └── route.ts  # Integração real com Claude
├── components/
│   └── chat/
│       └── GenerativeChat.tsx  # Interface principal do chat
├── lib/
│   ├── claude-tools.ts  # Ferramentas disponíveis (clima, busca, código)
│   └── mcp-tools.ts     # Integração MCP (em desenvolvimento)
├── .claude/
│   └── config.json      # Configuração do projeto Claude
├── .env                 # Variáveis de ambiente
├── CLAUDE.md           # Documentação principal
└── IMPLEMENTACAO_CLAUDE_SDK.md  # Este documento
```

## Configurações Necessárias

### Arquivo `.env`:
```env
AUTH_SECRET=zZ9tLz4Twoi9NkELbkSbtzqdifNsIPkLUmzms/HK0mA=
```

### Dependências:
- Node.js: v18.19.1
- NPM: v9.2.0
- Claude Code: @anthropic-ai/claude-code@1.0.108 (instalado globalmente)

## Status Final

**Implementado:**
- ✅ Integração direta com Claude instalado
- ✅ Respostas reais da IA via CLI
- ✅ Streaming de respostas funcionando
- ✅ Detecção automática de ferramentas
- ✅ Tema claro forçado como padrão
- ✅ Apenas ferramenta de clima ativa

**Pendente:**
- 🚧 Limitações de usuário
- 🚧 Integração real com APIs externas
- 🚧 Sistema de cache
- 🚧 Métricas e monitoring

## Troubleshooting

### Claude não responde
1. Verificar instalação: `which claude`
2. Testar CLI: `echo "test" | claude -p`
3. Verificar logs: `npm run dev`

### Resposta cortada
1. Aumentar timeout em route.ts
2. Verificar limite de caracteres no stream
3. Monitorar memória do processo

### Erro de autenticação
1. Verificar AUTH_SECRET em .env
2. Limpar cookies do navegador
3. Reiniciar servidor Next.js

## Referências

- [Claude Code CLI Docs](https://docs.anthropic.com/claude-code)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Server-Sent Events MDN](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [NextAuth.js Docs](https://next-auth.js.org/)

---

*Documento técnico - Última atualização: 06/09/2025*
*Versão da implementação: 3.0 (Claude CLI com Arquivo)*