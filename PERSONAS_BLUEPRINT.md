# Blueprint das Personas - YSH AI Chatbot

## Visão Geral

O YSH AI Chatbot implementa um sistema de personas sofisticado que adapta a experiência do usuário baseado em seu perfil e necessidades. O sistema suporta múltiplas jornadas especializadas para energia solar, com diferentes níveis de acesso e funcionalidades.

## Personas Principais

### 1. **Owner Persona** (Proprietário)

**Descrição**: Usuário final consumidor interessado em instalar energia solar residencial.

#### Características

- **Perfil**: Proprietário de imóvel residencial
- **Objetivo**: Descobrir viabilidade e custo-benefício de sistema solar
- **Conhecimento Técnico**: Baixo a médio
- **Expectativas**: Experiência guiada e simplificada

#### Jornada Especializada

```
Investigation → Detection → Analysis → Dimensioning → Recommendation
```

#### Funcionalidades Habilitadas

- ✅ **Wizard Mode**: Interface guiada passo-a-passo
- ✅ **Photo Upload**: Upload de fotos do telhado
- ✅ **Bill Analysis**: Análise de conta de luz
- ✅ **Address Input**: Entrada de endereço para avaliação
- ✅ **Simplified Reports**: Relatórios simplificados
- ✅ **Cost Estimations**: Estimativas de custo acessíveis

#### Limitações

- ❌ Batch Processing (processamento em lote)
- ❌ Advanced Analytics (análises avançadas)
- ❌ API Access (acesso direto às APIs)

---

### 2. **Integrator Persona** (Integrador)

**Descrição**: Profissional do setor solar que instala e vende sistemas fotovoltaicos.

#### Características

- **Perfil**: Instalador, vendedor ou consultor solar
- **Objetivo**: Processar múltiplos leads e projetos simultaneamente
- **Conhecimento Técnico**: Alto
- **Expectativas**: Ferramentas avançadas e produtividade

#### Jornada Especializada

```
Investigation → Detection → Analysis → Dimensioning → Simulation → Installation → Monitoring → LeadMgmt
```

#### Funcionalidades Habilitadas

- ✅ **Batch Processing**: Processamento de múltiplos projetos
- ✅ **Advanced Analytics**: Análises técnicas detalhadas
- ✅ **API Integration**: Acesso direto às APIs do Google Cloud
- ✅ **Lead Management**: Gestão avançada de leads
- ✅ **Installation Planning**: Planejamento de instalação
- ✅ **Performance Monitoring**: Monitoramento em tempo real
- ✅ **Custom Reports**: Relatórios customizáveis

#### Limitações

- ❌ Wizard Mode (modo assistente simplificado)

---

## Personas de Autenticação

### 3. **Guest User** (Usuário Convidado)

**Descrição**: Usuário não autenticado que testa a aplicação.

#### Características

- **Acesso**: Limitado e temporário
- **Limitações**: 20 mensagens por dia
- **Modelos Disponíveis**:
  - chat-model (Grok Vision)
  - chat-model-reasoning (Grok Reasoning)
  - anthropic-claude-3-5-sonnet (Claude 3.5 Sonnet)
  - openai-gpt-4o (GPT-4o)

#### Funcionalidades

- ✅ Acesso básico ao chat
- ✅ Upload de arquivos
- ✅ Uso de modelos básicos
- ❌ Persistência de dados
- ❌ Funcionalidades avançadas

---

### 4. **Regular User** (Usuário Registrado)

**Descrição**: Usuário autenticado com conta completa.

#### Características

- **Acesso**: Completo e persistente
- **Limitações**: 100 mensagens por dia
- **Modelos Disponíveis**: Todos os modelos disponíveis
- **Armazenamento**: Dados persistentes no banco

#### Funcionalidades

- ✅ Todas as funcionalidades do Guest
- ✅ Histórico de conversas
- ✅ Preferências salvas
- ✅ Export de dados
- ✅ Configurações personalizadas

---

## Jornada Solar Inteligente

### Fases da Jornada

#### **Investigation** (Investigação)

- **Persona Owner**: Coleta inicial de informações
- **Persona Integrator**: Qualificação de leads
- **Cards**: IntentCard, LeadValidationCard, LeadEnrichmentCard
- **Objetivo**: Classificar intenção e validar lead

#### **Detection** (Detecção)

- **Persona Owner**: Análise preliminar do local
- **Persona Integrator**: Avaliação técnica inicial
- **Cards**: DetectionCard
- **Objetivo**: Identificar potencial solar

#### **Analysis** (Análise)

- **Persona Owner**: Avaliação básica de viabilidade
- **Persona Integrator**: Análise técnica detalhada
- **Cards**: AnalysisCard
- **Objetivo**: Analisar condições e restrições

#### **Dimensioning** (Dimensionamento)

- **Persona Owner**: Estimativa básica do sistema
- **Persona Integrator**: Dimensionamento técnico preciso
- **Cards**: DimensioningCard
- **Objetivo**: Calcular tamanho ideal do sistema

#### **Simulation** (Simulação) - *Integrator Only*

- **Cards**: SimulationCard
- **Objetivo**: Simular performance e geração

#### **Installation** (Instalação) - *Integrator Only*

- **Cards**: InstallationCard
- **Objetivo**: Planejamento e agendamento

#### **Monitoring** (Monitoramento) - *Integrator Only*

- **Cards**: MonitoringCard
- **Objetivo**: Acompanhamento pós-instalação

#### **Recommendation** (Recomendação)

- **Persona Owner**: Proposta final simplificada
- **Persona Integrator**: Proposta técnica completa
- **Cards**: RecommendationCard
- **Objetivo**: Apresentar solução final

#### **LeadMgmt** (Gestão de Leads) - *Integrator Only*

- **Cards**: LeadMgmtCard
- **Objetivo**: Gestão e acompanhamento de vendas

---

## Sistema de Feature Gates

### Implementação Técnica

```typescript
// Context de Persona
interface PersonaContextValue {
  mode: PersonaMode; // "owner" | "integrator"
  permissions: string[];
  featureFlags: Record<string, boolean>;
  setMode: (mode: PersonaMode) => void;
  hasPermission: (perm: string) => boolean;
  isEnabled: (flag: string) => boolean;
}

// Componente FeatureGate
<FeatureGate permission="integrator" flag="advanced">
  <AdvancedFeature />
</FeatureGate>
```

### Flags por Persona

#### Owner Persona

```typescript
{
  wizard: true,      // Modo assistente
  // advanced: false  // Não disponível
  // batch: false     // Não disponível
}
```

#### Integrator Persona

```typescript
{
  // wizard: false    // Não disponível
  advanced: true,    // Análises avançadas
  batch: true        // Processamento em lote
}
```

---

## AI Gateways por Persona

### Modelos Disponíveis

#### **Owner Persona**

- **Grok Vision**: Modelo multimodal básico
- **Grok Reasoning**: Para questões complexas
- **Claude 3.5 Sonnet**: Modelo avançado
- **GPT-4o**: Modelo premium

#### **Integrator Persona**

- **Todos os modelos Owner**
- **Gemini Pro**: Via Vertex AI
- **Gemini Pro Vision**: Multimodal avançado
- **Modelos Ollama**: Para processamento local

### Providers Suportados

#### **Local (Ollama)**

- **Vantagem**: Privacidade e custo zero
- **Limitação**: Performance dependente do hardware
- **Uso**: Desenvolvimento e testes

#### **Vertex AI (Google Cloud)**

- **Vantagem**: Alta performance e escalabilidade
- **Limitação**: Custos associados
- **Uso**: Produção e casos complexos

#### **Vercel AI Gateway**

- **Vantagem**: Balanceamento automático
- **Limitação**: Dependente de configuração
- **Uso**: Ambiente padrão

---

## Experiência do Usuário

### Owner Persona - Fluxo Simplificado

1. **Onboarding**: Upload de foto/conta de luz
2. **Wizard**: Guiado através das fases essenciais
3. **Resultados**: Relatórios claros e acionáveis
4. **Ação**: Contato direto com integradores

### Integrator Persona - Fluxo Avançado

1. **Dashboard**: Visão geral de múltiplos projetos
2. **Batch Processing**: Análise de vários leads simultaneamente
3. **API Integration**: Conexão com sistemas externos
4. **Lead Management**: Acompanhamento completo do funil

---

## Métricas e Analytics

### Owner Persona

- **Conversões**: Taxa de leads qualificados
- **Engajamento**: Tempo na plataforma
- **Satisfação**: Feedback e avaliações

### Integrator Persona

- **Produtividade**: Leads processados por hora
- **Conversão**: Taxa de fechamento de vendas
- **ROI**: Retorno sobre investimento
- **API Usage**: Utilização de recursos cloud

---

## Roadmap de Evolução

### Curto Prazo

- [ ] Personalização baseada em histórico
- [ ] Recomendações inteligentes
- [ ] Integração com CRM

### Médio Prazo

- [ ] Analytics avançados por persona
- [ ] A/B testing de jornadas
- [ ] Gamification para owners

### Longo Prazo

- [ ] IA preditiva por persona
- [ ] Marketplace de integradores
- [ ] Certificações e treinamentos

---

## Conclusão

O sistema de personas do YSH AI Chatbot cria uma experiência altamente especializada e personalizada para cada tipo de usuário. A separação clara entre Owner e Integrator personas permite otimizar a jornada de cada usuário enquanto mantém a eficiência operacional e a satisfação do cliente.</content>
<parameter name="filePath">c:\Users\fjuni\ai-ysh\PERSONAS_BLUEPRINT.md
