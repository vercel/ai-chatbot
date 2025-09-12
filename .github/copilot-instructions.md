# Instruções para Agentes de IA do Chatbot YSH AI

## Visão Geral do Projeto

Esta é uma aplicação de chatbot de IA para pré-vendas de energia solar, construída com Next.js 15, React 19, TypeScript e Vercel AI SDK. A aplicação suporta fluxos conversacionais multi-agente para proprietários de imóveis ("owners") e integradores solares ("integrators").

## Visão Geral da Arquitetura

### Tecnologias Principais
- **Framework**: Next.js 15 com App Router
- **UI**: shadcn/ui + Tailwind CSS + primitivos Radix UI
- **IA**: Vercel AI SDK com múltiplos provedores (xAI/Grok, OpenAI, Anthropic)
- **Banco de Dados**: PostgreSQL com Drizzle ORM
- **Gerenciamento de Estado**: React Context + SWR para estado do servidor
- **Gerenciador de Pacotes**: pnpm

### Componentes Arquiteturais Principais

#### 1. Sistema de Persona (`lib/persona/`)
- **Modo Owner**: Jornada focada no consumidor com sobreposição de assistente guiado
- **Modo Integrator**: Focado em negócios com processamento em lote e recursos avançados
- Contexto armazenado em localStorage, afeta disponibilidade de UI e recursos
- Use o hook `usePersona()` para componentes cientes de persona
- Permissões e flags de recursos gerenciados via `PersonaProvider`

#### 2. Sistema de Fluxo de Jornada (`apps/web/lib/journey/`)
Fases: Investigação → Detecção → Análise → Dimensionamento → Simulação → Instalação → Monitoramento → Recomendação → Gerenciamento de Leads
- Cada fase tem cartões e visualizadores específicos definidos em `journeyMap`
- Navegação entre fases com validação
- Localizado em `app/journey/[phase]/`
- Exemplo: Fase de Detecção usa componentes `RoofUpload` e `DetectionReport`

#### 3. Componentes Multi-Agente (`components/multi-agent/`)
- Renderização de mensagens baseada em fase com ícones e estilização
- Exibição de conteúdo em streaming para cada fase conversacional
- Reutilizável em diferentes fluxos de agentes

#### 4. Sistema de Artefatos (`lib/artifacts/`)
- Suporta documentos de texto, código e planilha
- Manipuladores de documentos para operações de criação/atualização
- Armazenamento persistente com associação de usuário
- Capacidades de edição colaborativa em tempo real

#### 5. Arquitetura de Chat (`components/chat.tsx`)
- Usa `@ai-sdk/react` com camada de transporte personalizada
- Streaming em tempo real com contextos retomáveis
- Suporte a entrada multimodal (texto, imagens, arquivos)
- Arquitetura de partes de mensagens para conteúdo complexo
- Manipula anexos e fluxos de dados

#### 6. Esquema de Banco de Dados (`lib/db/schema.ts`)
- Tabelas: usuários, chats, mensagens (com partes), votos, documentos, sugestões
- Usa Drizzle ORM com tipagem estrita
- Arquitetura de mensagens suporta texto, raciocínio, arquivos, ferramentas
- Relacionamentos de chave estrangeira e exclusões em cascata

## Fluxos de Trabalho Críticos do Desenvolvedor

### Configuração de Desenvolvimento
```bash
pnpm install
pnpm dev  # Executa com modo Turbo
```

### Operações de Banco de Dados
```bash
# Gerar migrações a partir de mudanças no esquema
pnpm db:generate

# Aplicar migrações
pnpm db:migrate

# Enviar mudanças de esquema (desenvolvimento)
pnpm db:push

# Abrir Drizzle Studio
pnpm db:studio
```

### Qualidade do Código
```bash
# Lint e formatação (inclui Biome)
pnpm lint

# Formatação apenas
pnpm format

# Verificação TypeScript incluída no build
pnpm build
```

### Testes
```bash
# Testes unitários com Vitest
pnpm test

# Testes E2E com Playwright
pnpm test:e2e

# Testes E2E específicos
pnpm test:e2e:chat
pnpm test:e2e:journey
pnpm test:e2e:persona

# Storybook para desenvolvimento de componentes
pnpm storybook
```

### Testes Avançados (Suite 360)
```bash
# Testes de performance
pnpm test:360:performance

# Testes de acessibilidade
pnpm test:360:accessibility

# Regressão visual
pnpm test:360:visual

# Testes cross-browser
pnpm test:360:crossbrowser
```

## Padrões Específicos do Projeto

### 1. Arquitetura de Mensagens
- Use o tipo `ChatMessage` com array `parts` para conteúdo complexo
- Suporte para texto, imagens e chamadas de ferramentas
- Anexos separados das partes da mensagem
- Sistema de votos para feedback de mensagens
- Exemplo em `lib/db/schema.ts`: tabela de mensagens com relação de partes

### 2. Padrões de Integração de IA
```typescript
// Configuração de modelos em lib/ai/models.ts
// Configuração de provedores em lib/ai/providers.ts
// Ferramentas em lib/ai/tools/
// Prompts em lib/ai/prompts.ts
```

### 3. Padrões de Banco de Dados
- Use Drizzle ORM com tipagem estrita
- Esquema em `lib/db/schema.ts`
- Consultas em `lib/db/queries.ts`
- Migrações em `lib/db/migrations/`
- Exemplo: `InferSelectModel<typeof user>` para consultas type-safe

### 4. Padrões de Componentes
- Componentes com gate de recursos usando `feature-gate.tsx`
- Primeiro acessibilidade com suporte ARIA
- Ciente de tema com `next-themes`
- Design responsivo com Tailwind
- Componentes cientes de persona usando hook `usePersona()`

### 5. Tratamento de Erros
- Classe `ChatSDKError` personalizada
- Respostas de erro consistentes das rotas da API
- Notificações toast para feedback do usuário
- Fallbacks graciosos no streaming

### 6. Padrões de Validação
- Use esquemas Zod para validação de entrada
- Validação server-side em rotas da API e server actions
- Exemplo: Esquema `IntentData` em componentes de intent

### 7. Gerenciamento de Estado
- SWR para estado do servidor e cache
- React Context para estado global da aplicação (tema, persona)
- Local storage para preferências do usuário
- Fluxos de dados para atualizações em tempo real

## Componentes de Lógica de Negócios

### Módulo Financeiro (`lib/finance/`)
- Simulação de financiamento com cálculos de amortização
- Análise de período de payback
- Cálculos de ROI solar

### Cartões de Jornada
- **IntentCard**: Classifica intenções do usuário
- **LeadValidationCard**: Valida dados de prospect
- **PanelDetectionCard**: Análise de telhado alimentada por IA
- **TechnicalFeasibilityCard**: Avaliação de viabilidade do sistema
- **FinancialAnalysisCard**: Análise custo-benefício

### Sistema de Agentes (`lib/ai/agents/`)
- **SolarCalculatorAgent**: Cálculos e ROI solares
- **LeadQualificationAgent**: Pontuação de prospects
- **DetectionAgent**: Análise de telhado
- **AgentOrchestrator**: Coordenação multi-agente

## Convenções de Organização de Arquivos

### Diretórios Principais
- `app/(chat)/`: Rotas principais da interface de chat
- `app/(auth)/`: Fluxos de autenticação
- `app/api/`: Rotas da API (mínimas, maioria da lógica em actions)
- `components/`: Componentes UI reutilizáveis
- `lib/`: Lógica de negócio e utilitários
- `artifacts/`: Manipuladores de processamento de documentos
- `hooks/`: Hooks customizados do React
- `types/`: Definições de tipos TypeScript
- `tests/`: Suites de testes (unitários, e2e, stories)

### Convenções de Nomenclatura
- Componentes: PascalCase com extensão `.tsx`
- Utilitários: camelCase com extensão `.ts`
- Rotas da API: `route.ts` em roteamento baseado em pasta
- Banco de dados: Snake_case para SQL, camelCase para TypeScript
- Hooks: Prefixo `use*`

## Padrões Comuns e Armadilhas

### 1. Arquitetura de Streaming
- Use `createUIMessageStream` para respostas de IA
- Manipule streams retomáveis com Redis (opcional)
- Contexto de fluxo de dados para atualizações em tempo real
- Tratamento de erros no callback `onError`

### 2. Autenticação
- Integração NextAuth.js com provedores customizados
- Suporte a usuário convidado para demos
- Sistema de direitos baseado em sessão

### 3. Uploads de Arquivos
- Armazenamento Vercel Blob para persistência de arquivos
- Componente de entrada multimodal para vários tipos de arquivo
- Pré-processamento e validação de anexos

### 4. Otimizações de Build
- Modo Turbo do Next.js para desenvolvimento
- Tree shaking com imports dinâmicos
- Otimização de imagens com componente Image do Next.js

### 5. Padrões de Testes
- Testes unitários com Vitest + RTL
- E2E com Playwright (múltiplas configurações)
- Stories com Storybook
- Suite de testes 360 para cobertura abrangente

## Arquivos Principais para Referência

- `lib/db/schema.ts`: Esquema e tipos do banco de dados
- `lib/ai/models.ts`: Configurações de modelos de IA
- `components/chat.tsx`: Arquitetura principal do componente de chat
- `lib/persona/context.tsx`: Implementação do sistema de persona
- `apps/web/lib/journey/map.ts`: Definições de fases da jornada
- `lib/artifacts/server.ts`: Padrões de manipulação de documentos
- `package.json`: Todos os scripts disponíveis e dependências
- `README.md`: Visão geral e configuração do projeto

## Melhores Práticas de Desenvolvimento

1. **Sempre execute migrações** após mudanças no esquema: `pnpm db:migrate`
2. **Use TypeScript estritamente** - sem tipos `any` sem justificativa
3. **Teste fluxos E2E** com Playwright para jornadas críticas do usuário
4. **Siga diretrizes de acessibilidade** - todos os componentes devem ser navegáveis por teclado
5. **Use o sistema de persona** para gate de recursos e UI condicional
6. **Manipule erros de streaming graciosamente** com fallbacks adequados
7. **Valide dados** nos limites da API usando esquemas Zod
8. **Mantenha componentes modulares** e reutilizáveis em diferentes contextos
9. **Use SWR para estado do servidor** e React Context para estado do cliente
10. **Referencie fases da jornada** ao adicionar novos recursos

## Pontos de Integração

### Serviços Externos
- **Provedores de IA**: Vercel AI Gateway para balanceamento de carga
- **Armazenamento**: Vercel Blob para uploads de arquivos
- **Banco de Dados**: PostgreSQL via Vercel Postgres
- **Auth**: NextAuth.js com múltiplos provedores

### Comunicação Entre Componentes
- **Fluxos de Dados**: Atualizações em tempo real via `useDataStream`
- **Provedores de Contexto**: Persona, tema e estado do chat
- **Server Actions**: Submissões de formulários e chamadas da API
- **Mutações SWR**: Invalidação de cache e atualizações

Este guia deve ajudar agentes de IA a entender a estrutura do código, padrões principais e fluxos de trabalho de desenvolvimento. Para seções pouco claras ou informações faltantes, forneça feedback para melhorar esta documentação.</content>
<parameter name="filePath">c:\Users\fjuni\ysh-root\ai-ysh\.github\copilot-instructions.md