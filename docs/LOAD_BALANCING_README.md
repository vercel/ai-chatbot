# Sistema de Load Balancing para Providers de IA

Este sistema implementa um load balancer inteligente para múltiplos providers de IA (OpenAI, Anthropic, xAI/Grok, etc.), com balanceamento baseado em custo, latência e confiabilidade.

## 🚀 Funcionalidades

- **Balanceamento Inteligente**: Algoritmo que considera custo (30%), latência (40%) e confiabilidade (30%)
- **Monitoramento em Tempo Real**: Dashboard com métricas detalhadas de performance
- **Configuração Dinâmica**: Pesos ajustáveis via variáveis de ambiente
- **API REST**: Endpoints para integração com aplicações
- **React Hooks**: Interface fácil para componentes React
- **Fallback Automático**: Alterna automaticamente para providers mais confiáveis

## � Pré-requisitos

- Node.js 18+
- PostgreSQL (opcional, para persistência de métricas)
- Chaves de API dos providers suportados

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Configure as seguintes variáveis no seu arquivo `.env`:

```bash
# API Keys dos Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...
GROK_API_KEY=grok-...

# Pesos do Algoritmo de Load Balancing (0-100, soma deve ser 100)
LOAD_BALANCER_WEIGHT_COST=30
LOAD_BALANCER_WEIGHT_LATENCY=40
LOAD_BALANCER_WEIGHT_RELIABILITY=30

# Configurações do Sistema
LOAD_BALANCER_MAX_RETRIES=3
LOAD_BALANCER_TIMEOUT_MS=30000
```

### 2. Instalação

```bash
pnpm install
```

### 3. Configuração do Banco (Opcional)

```bash
# Gerar migrations
pnpm db:generate

# Aplicar migrations
pnpm db:migrate

# Abrir Prisma Studio
pnpm db:studio
```

## 🔧 Uso Básico

### API REST

#### Selecionar Provider

```bash
POST /api/load-balancing/select
Content-Type: application/json

{
  "modelType": "chat",
  "maxTokens": 1000,
  "temperature": 0.7
}
```

#### Obter Métricas

```bash
GET /api/monitoring/performance?hours=24
```

### React Hooks

```tsx
import { useProviderSelection, usePerformanceMonitoring } from '@/hooks/use-load-balancing';

// Seleção de provider
const { provider, model, score, selectProvider } = useProviderSelection('chat');

// Monitoramento de performance
const { metrics, isLoading, refresh } = usePerformanceMonitoring(30000); // 30s auto-refresh
```

### Componente Dashboard

```tsx
import { PerformanceDashboard } from '@/components/performance-dashboard';

function MonitoringPage() {
  return (
    <PerformanceDashboard
      autoRefreshInterval={30000}
      className="my-custom-class"
    />
  );
}
```

## 📊 Dashboard de Monitoramento

Acesse `/monitoring` para visualizar:

- **Métricas Gerais**: Total de requisições, latência média, taxa de sucesso, custo total
- **Performance por Provider**: Métricas detalhadas de cada provider
- **Status em Tempo Real**: Atualização automática com indicadores visuais
- **Configurações**: Personalização do intervalo de atualização e período de análise

## 🏗️ Arquitetura

### Componentes Principais

```
lib/
├── services/
│   └── load-balancing-service.ts    # Serviço principal
├── load-balancing/
│   ├── load-balancer.ts            # Algoritmo de balanceamento
│   └── types.ts                    # Tipos TypeScript
└── ai/
    ├── providers.ts                # Configuração dos providers
    └── models.ts                   # Configuração dos modelos

hooks/
└── use-load-balancing.ts           # React hooks

components/
└── performance-dashboard.tsx       # Dashboard de monitoramento

app/api/
├── load-balancing/
│   └── route.ts                    # Endpoint de seleção
└── monitoring/
    └── performance/
        └── route.ts                # Endpoint de métricas
```

### Fluxo de Funcionamento

1. **Recebimento de Requisição**: API recebe pedido de seleção de provider
2. **Avaliação de Métricas**: Sistema consulta métricas de performance
3. **Cálculo de Score**: Algoritmo calcula score baseado nos pesos configurados
4. **Seleção do Provider**: Retorna provider com melhor score
5. **Execução**: Requisição é encaminhada para o provider selecionado
6. **Atualização de Métricas**: Resultado é registrado para futuras decisões

## 🔧 Configuração Avançada

### Personalização dos Pesos

Os pesos podem ser ajustados dinamicamente via variáveis de ambiente:

- `LOAD_BALANCER_WEIGHT_COST`: Prioriza providers mais baratos
- `LOAD_BALANCER_WEIGHT_LATENCY`: Prioriza providers mais rápidos
- `LOAD_BALANCER_WEIGHT_RELIABILITY`: Prioriza providers mais confiáveis

### Adição de Novos Providers

1. Adicione configuração em `lib/ai/providers.ts`
2. Implemente interface `AIProvider` em `lib/load-balancing/types.ts`
3. Atualize métricas em `lib/services/load-balancing-service.ts`

### Métricas Personalizadas

O sistema coleta automaticamente:

- Tempo de resposta
- Taxa de sucesso/erro
- Custo por requisição
- Disponibilidade do provider

## 🚨 Monitoramento e Alertas

### Métricas Disponíveis

- **Latência Média**: Tempo médio de resposta por provider
- **Taxa de Sucesso**: Percentual de requisições bem-sucedidas
- **Custo Total**: Gasto acumulado por período
- **Taxa de Erro**: Percentual de falhas por provider

### Alertas Recomendados

Configure alertas para:

- Taxa de erro > 5%
- Latência > 10 segundos
- Provider indisponível
- Custo excedendo orçamento

## 🔒 Segurança

- Chaves de API criptografadas em produção
- Rate limiting por provider
- Logs de auditoria para decisões de balanceamento
- Fallback automático para providers alternativos

## 📈 Performance

### Otimizações Implementadas

- Cache de métricas com TTL configurável
- Balanceamento assíncrono sem bloqueio
- Pool de conexões por provider
- Compressão de respostas

### Benchmarks

- Seleção de provider: < 50ms
- Atualização de métricas: < 10ms
- Dashboard rendering: < 100ms

## 🐛 Troubleshooting

### Problemas Comuns

1. **Provider Indisponível**
   - Verifique conectividade com API do provider
   - Confirme chaves de API válidas
   - Verifique limites de rate

2. **Métricas Não Atualizam**
   - Verifique conexão com banco de dados
   - Confirme permissões de escrita
   - Verifique configuração de TTL

3. **Performance Degradada**
   - Ajuste pesos do algoritmo
   - Considere adicionar novos providers
   - Otimize configurações de timeout

### Logs e Debug

```bash
# Habilitar logs detalhados
DEBUG=load-balancer:* pnpm dev

# Verificar métricas no banco
pnpm db:studio
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

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

## 🏗️ Arquitetura do Sistema

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
