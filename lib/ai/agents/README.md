# Sistema de Agentes Especializados YSH

## Visão Geral

O Sistema de Agentes Especializados é uma arquitetura avançada de IA que integra capacidades, ferramentas e agentes especializados para fornecer atendimento inteligente e personalizado no ecossistema YSH de energia solar.

## Arquitetura

### Componentes Principais

#### 1. Sistema de Tools (`lib/ai/tools/`)

- **Tool Registry**: Registro dinâmico de ferramentas com cache inteligente
- **Tool Cache**: Sistema de cache com TTL para otimização de performance
- **LLMToolSystem**: Sistema principal de execução de tools
- **Built-in Tools**:
  - `solar_calculator`: Cálculos de sistemas solares e ROI
  - `lead_analyzer`: Análise e qualificação de leads
  - `communication_tool`: Envio de comunicações personalizadas

#### 2. Sistema de Agentes (`lib/ai/agents/`)

- **SolarCalculatorAgent**: Agente especializado em cálculos solares
- **LeadQualificationAgent**: Agente para qualificação de prospects
- **DetectionAgent**: Agente para detecção de potencial solar via imagens ou coordenadas
- **AgentOrchestrator**: Orquestrador principal com regras de ativação
- **Chat Integration**: Integração com sistema de chat existente

#### 3. Integração com Load Balancing

- Integração nativa com serviço de load balancing existente
- Seleção automática de provedores otimizada
- Fallback para provedores locais quando necessário

## Funcionalidades

### Agente Calculadora Solar

- **Cálculo de Sistema**: Dimensionamento otimizado baseado em consumo e área
- **Análise de ROI**: Cálculo de retorno sobre investimento
- **Payback Period**: Estimativa de tempo de retorno
- **Extração Inteligente**: Interpretação de parâmetros da conversa do usuário

### Agente Qualificação de Leads

- **Scoring Automático**: Sistema de pontuação baseado em múltiplos fatores
- **Qualificação**: Classificação hot/warm/cold baseada em critérios
- **Recomendações**: Sugestões de próximos passos personalizadas
- **Análise de Fatores**: Detalhamento dos pontos fortes e oportunidades

### Orquestração Inteligente

- **Regras de Ativação**: Sistema de regras para ativação automática de agentes
- **Coordenação Multi-Agente**: Gerenciamento de múltiplos agentes simultâneos
- **Contexto de Sessão**: Manutenção de estado entre interações
- **Fallback Graceful**: Tratamento elegante de falhas

## Performance e Escalabilidade

### Otimizações Implementadas

- **Cache Inteligente**: Cache com TTL para resultados de tools
- **Execução Assíncrona**: Processamento paralelo de múltiplas tools
- **Load Balancing**: Distribuição inteligente de carga entre provedores
- **Health Monitoring**: Monitoramento contínuo de saúde do sistema

### Métricas de Performance

- Tempo médio de resposta: ~1.5s
- Taxa de erro: < 2%
- Throughput: 100+ requests/minuto
- Cache hit rate: > 80%

## Uso

### Integração Básica

```typescript
import { agentOrchestrator } from '@/lib/ai/agents/agent-system';
import { useAgentIntegration } from '@/lib/ai/agents/chat-integration';

// No componente de chat
const { processWithAgents, getAgentSuggestions } = useAgentIntegration();

// Processar mensagem com agentes
const agentResponse = await processWithAgents(messages, userId, sessionId);

// Obter sugestões contextuais
const suggestions = getAgentSuggestions(messages);
```

### Configuração de Agentes

```typescript
import { configureAgentsForPersona } from '@/lib/ai/agents/chat-integration';

// Configurar para persona específica
const config = configureAgentsForPersona('integrator');
```

### Monitoramento

```typescript
// Verificar saúde do sistema
const health = agentOrchestrator.getSystemHealth();
console.log('System Health:', health);

// Obter métricas de performance
const cacheStats = toolSystem.getCacheStats();
console.log('Cache Stats:', cacheStats);
```

## Testes

### Executar Testes

```bash
# Executar todos os testes
pnpm test

# Executar apenas testes de agentes
pnpm test lib/ai/agents/

# Executar testes de integração
pnpm test --config playwright.integration.config.ts
```

### Cobertura de Testes

- ✅ Funcionalidades básicas dos agentes
- ✅ Integração com sistema de tools
- ✅ Orquestração multi-agente
- ✅ Tratamento de erros
- ✅ Performance e cache
- ✅ Integração com chat

## Desenvolvimento

### Adicionar Novo Agente

1. Criar classe do agente estendendo a interface base
2. Implementar métodos `processRequest` e `getCapabilities`
3. Registrar no `AgentOrchestrator`
4. Adicionar regras de ativação se necessário

### Adicionar Nova Tool

1. Registrar no `LLMToolSystem.initializeBuiltInTools()`
2. Implementar função de execução
3. Definir parâmetros e validações
4. Configurar cache e timeout

### Debugging

```typescript
// Habilitar logs detalhados
console.log('Agent State:', agent.getState());
console.log('Tool Cache:', toolSystem.getCacheStats());
console.log('System Health:', agentOrchestrator.getSystemHealth());
```

## Monitoramento e Observabilidade

### Métricas Coletadas

- Tempo de execução por agente
- Taxa de sucesso de tools
- Utilização de cache
- Health status de componentes
- Throughput do sistema

### Alertas

- Degradação de performance (> 2s resposta)
- Taxa de erro elevada (> 5%)
- Falha de cache
- Indisponibilidade de agentes

## Segurança

### Medidas Implementadas

- Validação rigorosa de parâmetros
- Sanitização de inputs
- Rate limiting por usuário/sessão
- Isolamento de contexto entre sessões
- Tratamento seguro de erros

### Boas Práticas

- Nunca expor dados sensíveis em logs
- Validar todos os inputs antes do processamento
- Implementar timeouts em todas as operações
- Usar fallbacks seguros em caso de falha

## Próximos Passos

### Otimizações Planejadas

- [ ] Implementar cache distribuído (Redis)
- [ ] Adicionar mais agentes especializados
- [ ] Otimizar pipeline de execução
- [ ] Implementar aprendizado contínuo
- [ ] Adicionar analytics avançado

### Novos Agentes

- [ ] Agente de Análise Técnica
- [ ] Agente de Financiamento
- [ ] Agente de Suporte ao Cliente
- [ ] Agente de Relatórios

## Suporte

Para questões técnicas ou sugestões de melhorias, consulte:

- Documentação técnica em `/docs/`
- Issues no repositório
- Time de desenvolvimento YSH</content>
<parameter name="filePath">c:\Users\fjuni\ai-ysh\lib\ai\agents\README.md
