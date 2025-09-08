# AI Gateways Configuration

Este documento explica como configurar e usar os diferentes AI gateways disponíveis no sistema: Ollama (local), Vertex AI (Google Cloud) e Vercel AI Gateway.

## Configuração de Ambiente

### 1. Ollama (Local)

```bash
# .env.local
AI_GATEWAY_API_KEY=local
```

**Pré-requisitos:**

- Instalar Ollama: <https://ollama.ai/>
- Executar modelos localmente:

```bash
ollama pull qwen3:30b
ollama pull llama3.2-vision:latest
ollama pull mistral:latest
ollama pull llava:latest
```

### 2. Vertex AI (Google Cloud)

```bash
# .env.local
AI_GATEWAY_API_KEY=vertex
GOOGLE_CLOUD_API_KEY=YOUR_GOOGLE_CLOUD_API_KEY
GOOGLE_CLOUD_PROJECT_ID=your-project-id  # Opcional
```

**Pré-requisitos:**

- Conta Google Cloud Platform
- API Key válida do Google Cloud
- Projeto GCP configurado (opcional)

### 3. Vercel AI Gateway (Padrão)

```bash
# .env.local
AI_GATEWAY_API_KEY=your-vercel-gateway-key
```

## Modelos Disponíveis

### Ollama (Local)

- **chat-model**: qwen3:30b
- **chat-model-reasoning**: qwen3:30b (com reasoning)
- **title-model**: falcon3:latest
- **artifact-model**: falcon3:latest
- **anthropic-claude-3-5-sonnet**: qwen3:30b
- **openai-gpt-4o**: llama3.2-vision:latest
- **vertex-gemini-pro**: mistral:latest
- **vertex-gemini-pro-vision**: llava:latest

### Vertex AI (Google Cloud)

- **chat-model**: models/gemini-pro
- **chat-model-reasoning**: models/gemini-pro (com reasoning)
- **title-model**: models/gemini-pro
- **artifact-model**: models/gemini-pro
- **anthropic-claude-3-5-sonnet**: models/gemini-pro
- **openai-gpt-4o**: models/gemini-pro
- **vertex-gemini-pro**: models/gemini-pro
- **vertex-gemini-pro-vision**: models/gemini-pro-vision

### Vercel AI Gateway

- **chat-model**: xai/grok-2-vision-1212
- **chat-model-reasoning**: xai/grok-3-mini-beta (com reasoning)
- **title-model**: xai/grok-2-1212
- **artifact-model**: xai/grok-2-1212
- **anthropic-claude-3-5-sonnet**: anthropic/claude-3-5-sonnet
- **openai-gpt-4o**: openai/gpt-4o
- **vertex-gemini-pro**: google/gemini-pro
- **vertex-gemini-pro-vision**: google/gemini-pro-vision

## Como Usar

### 1. Seleção de Provider

Use o componente `ProviderSelector` para permitir que os usuários alternem entre os providers:

```tsx
import { ProviderSelector } from '@/components/provider-selector';

function MyComponent() {
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('local');

  return (
    <ProviderSelector
      selectedProvider={selectedProvider}
      onProviderChange={setSelectedProvider}
    />
  );
}
```

### 2. Configuração Dinâmica

O sistema detecta automaticamente o provider baseado na variável `AI_GATEWAY_API_KEY`:

- `local` → Ollama
- `vertex` → Vertex AI
- Qualquer outro valor → Vercel AI Gateway

### 3. Modelos Disponíveis

Todos os modelos estão disponíveis independentemente do provider selecionado, mas são mapeados para modelos específicos de cada provider.

## APIs do Google Cloud Utilizadas

O sistema está configurado para usar as seguintes APIs do Google Cloud Platform:

- **Generative Language API** (Gemini models)
- **Vertex AI API** (Machine learning models)
- **Cloud Storage API** (Para armazenamento de arquivos)
- **Cloud Vision API** (Para processamento de imagens)

## Monitoramento e Logs

### Métricas Disponíveis

- Solicitações por API
- Taxa de erros (%)
- Latência mediana (ms)
- Latência 95% (ms)

### APIs Monitoradas

- Maps Static API
- Maps JavaScript API
- Street View Static API
- Generative Language API
- BigQuery API
- Cloud Storage API
- Vertex AI API

## Troubleshooting

### Problemas Comuns

1. **Erro de autenticação no Vertex AI**
   - Verifique se a API key está correta
   - Confirme se o projeto GCP está ativo
   - Verifique as quotas da API

2. **Modelos não encontrados no Ollama**
   - Execute `ollama pull <model-name>` para baixar o modelo
   - Verifique se o Ollama está rodando: `ollama serve`

3. **Erro no Vercel AI Gateway**
   - Verifique se a chave da API está configurada
   - Confirme se o projeto Vercel tem acesso ao gateway

### Comandos Úteis

```bash
# Verificar status do Ollama
curl http://localhost:11434/api/tags

# Testar Vertex AI
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

# Verificar variáveis de ambiente
echo $AI_GATEWAY_API_KEY
echo $GOOGLE_CLOUD_API_KEY
```

## Próximos Passos

- Implementar cache inteligente para reduzir latência
- Adicionar monitoramento em tempo real
- Suporte a modelos customizados
- Otimização de custos entre providers
- Load balancing automático
