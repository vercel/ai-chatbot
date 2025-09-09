# Sistema de Load Balancing e Monitoramento de IA

Este documento descreve o sistema completo implementado para alternância inteligente de providers de IA, monitoramento de performance e load balancing baseado em custo e latência.

## 🚀 Funcionalidades Implementadas

### 1. Teste de Providers

- ✅ Alternância entre local (Ollama), Vertex AI e gateway padrão
- ✅ Scripts de teste automatizados
- ✅ Verificação de conectividade e funcionalidade

### 2. Configuração Ollama

- ✅ Download automático de modelos necessários
- ✅ Modelos instalados: qwen3:30b, falcon3:latest, llama3.2-vision:latest, mistral:latest
- ✅ Scripts de verificação de saúde dos modelos

### 3. Monitoramento de Performance

- ✅ Sistema de métricas em tempo real
- ✅ Rastreamento de latência, custo e taxa de sucesso
- ✅ API REST para consulta de métricas
- ✅ Integração com GCP Cloud Logging

### 4. Load Balancing Inteligente

- ✅ Seleção automática do melhor provider baseada em:
  - Custo por token
  - Latência média
  - Taxa de sucesso
  - Carga atual
  - Preferências do usuário
- ✅ API para tomada de decisões de roteamento
- ✅ Gerenciamento de carga concorrente

## 📊 Como Usar

### Testar Providers

```bash
# Executar testes de alternância
node scripts/test-providers.js

# Testar configuração Ollama
node scripts/test-ollama.js

# Testar sistema completo de load balancing
node scripts/test-load-balancing.js
```

### Configurar Ambiente

```bash
# Para usar provider local (Ollama)
AI_GATEWAY_API_KEY=local pnpm run dev

# Para usar Vertex AI
AI_GATEWAY_API_KEY=vertex pnpm run dev

# Para usar gateway padrão
AI_GATEWAY_API_KEY=your-key pnpm run dev
```

### APIs Disponíveis

#### Seleção de Provider Inteligente

```http
GET /api/load-balancing?modelType=chat&preferredProvider=xai&maxLatency=2000
```

Parâmetros:

- `modelType`: `chat` | `vision` | `reasoning` | `artifact`
- `preferredProvider`: Provider preferido (opcional)
- `maxCost`: Custo máximo por token (opcional)
- `maxLatency`: Latência máxima em ms (opcional)

#### Métricas de Performance

```http
GET /api/monitoring/performance?hours=24
```

Retorna estatísticas de todos os providers nas últimas N horas.

#### Gerenciamento de Carga

```http
POST /api/load-balancing
Content-Type: application/json

{
  "provider": "xai",
  "action": "increment" | "decrement"
}
```

## 🏗️ Arquitetura

### Componentes Principais

1. **Performance Monitor** (`lib/monitoring/performance.ts`)
   - Coleta métricas de latência, custo e sucesso
   - Armazenamento em memória com limite de 1000 entradas
   - Cálculo de custos baseado em provider/modelo

2. **Load Balancer** (`lib/load-balancing/load-balancer.ts`)
   - Algoritmo de pontuação multi-fator
   - Gerenciamento de carga concorrente
   - Configurações personalizáveis por provider

3. **Provider Integration** (`lib/ai/providers.ts`)
   - Função `getSmartProvider()` para seleção inteligente
   - Integração com sistema de load balancing
   - Fallback automático em caso de falhas

### Algoritmo de Load Balancing

O sistema usa uma pontuação ponderada baseada em:

- **Custo** (30%): Menor custo = maior pontuação
- **Latência** (40%): Menor latência = maior pontuação
- **Confiabilidade** (30%): Maior taxa de sucesso = maior pontuação
- **Carga** (10%): Menor carga atual = maior pontuação
- **Prioridade** (10%): Configuração manual de prioridade

## 📈 Monitoramento

### Métricas Coletadas

Por provider:

- Total de requisições
- Taxa de sucesso
- Latência média
- Custo total
- Tokens médios por requisição

Por modelo:

- Latência média
- Taxa de sucesso
- Custo por token

### Visualização

As métricas podem ser visualizadas via:

- API REST: `/api/monitoring/performance`
- Logs do console com prefixo `[PERFORMANCE]`
- GCP Cloud Logging (configurável)

## 🔧 Configuração

### Providers Suportados

| Provider | Modelo Base | Custo/1K tokens | Status |
|----------|-------------|----------------|---------|
| xAI | Grok | $0.0015 | ✅ Ativo |
| Anthropic | Claude 3.5 | $0.0030 | ✅ Ativo |
| OpenAI | GPT-4o | $0.0025 | ✅ Ativo |
| Google | Gemini Pro | $0.0010 | ✅ Ativo |
| Ollama | Vários | $0.0000 | ✅ Local |

### Configuração Personalizada

```typescript
import { loadBalancer } from '@/lib/load-balancing/load-balancer';

// Configurar pesos para um provider específico
loadBalancer.configureProvider('xai', {
  costWeight: 0.5,      // Dar mais peso ao custo
  latencyWeight: 0.3,   // Menos peso à latência
  maxConcurrent: 15     // Aumentar limite concorrente
});
```

## 🧪 Testes

### Testes Automatizados

```bash
# Testar alternância de providers
npm run test:providers

# Testar métricas de performance
npm run test:metrics

# Testar load balancing
npm run test:load-balancing
```

### Testes Manuais

1. **Verificar funcionamento básico**:

   ```bash
   curl "http://localhost:3000/api/load-balancing?modelType=chat"
   ```

2. **Testar com restrições**:

   ```bash
   curl "http://localhost:3000/api/load-balancing?modelType=vision&maxLatency=1000&preferredProvider=ollama"
   ```

3. **Verificar métricas**:

   ```bash
   curl "http://localhost:3000/api/monitoring/performance?hours=1"
   ```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Modelo Ollama não responde**
   - Verificar se o serviço está rodando: `ollama list`
   - Reiniciar serviço: `ollama serve`
   - Verificar modelos instalados

2. **Load balancer sempre escolhe o mesmo provider**
   - Verificar métricas: as decisões são baseadas em dados reais
   - Ajustar pesos de configuração se necessário

3. **Altas latências**
   - Verificar conectividade com providers externos
   - Considerar usar provider local (Ollama) como fallback

### Logs Úteis

```bash
# Ver logs de performance
grep "\[PERFORMANCE\]" logs/app.log

# Ver decisões de load balancing
grep "Load balancing decision" logs/app.log
```

## 🔮 Melhorias Futuras

- [ ] Dashboard web para visualização de métricas
- [ ] Alertas automáticos para degradação de performance
- [ ] Cache inteligente de respostas
- [ ] Auto-scaling baseado na demanda
- [ ] Integração com Prometheus/Grafana
- [ ] Machine learning para predição de carga

## 📝 Notas de Desenvolvimento

- O sistema usa imports dinâmicos para evitar dependências circulares
- Todas as métricas são armazenadas em memória (reiniciadas com o servidor)
- O load balancer funciona de forma stateless para cada requisição
- Fallback automático garante que o sistema sempre funcione, mesmo com falhas parciais
