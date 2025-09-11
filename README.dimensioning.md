# Dimensioning System

Módulo de dimensionamento de sistemas fotovoltaicos para a aplicação YSH AI Chatbot.

## Visão Geral

Este módulo permite aos usuários dimensionar sistemas FV com base nas características do telhado, preferências de equipamento e restrições. Suporta dois personas: "owner" (simplificado) e "integrator" (avançado).

## Arquitetura

### Componentes Principais

- **SiteInput**: Formulário de entrada para configuração do local e preferências
- **DimensioningSpec**: Exibição dos resultados do dimensionamento
- **Cálculo**: Lógica pura em `lib/dimensioning/calc.ts`
- **Serviço**: Integração com APIs externas em `lib/dimensioning/service.ts`

### Fluxo de Dados

1. Usuário preenche `SiteInput`
2. Dados enviados via server action ou API
3. Cálculo executado (local ou via API externa)
4. Resultados exibidos em `DimensioningSpec`

## Funcionalidades

### Persona Owner
- Entrada simplificada: área total ou L/W aproximados
- Seleção de módulo preferido
- Cálculo automático de inversor

### Persona Integrator
- Múltiplas seções com geometria detalhada
- Controle de orientação (portrait/landscape)
- Preferências de módulo e inversor
- Target DC/AC ratio customizável
- Export BOM em CSV

## Cálculos

### Packing de Painéis
- Margens de segurança (walkways/setbacks)
- Orientação otimizada (portrait vs landscape)
- Fator de sombreamento

### Seleção de Inversor
- Baseado em potência DC necessária
- Respeito ao target DC/AC ratio
- Preferência do usuário quando possível

### Dimensionamento de Strings
- Distribuição equilibrada entre MPPTs
- Respeito aos limites de tensão
- Folga para condições de frio

### BOM
- Lista completa de materiais
- Proteções DC e AC
- Quantidades calculadas

## Desenvolvimento

### Dependências
- Next.js 15 + React 19
- TypeScript
- Zod para validação
- Tailwind + shadcn/ui

### Testes
- Unitários: funções de cálculo
- E2E: fluxos completos
- Stories: componentes isolados

### Scripts
```bash
# Desenvolvimento
pnpm dev

# Testes
pnpm test
pnpm test:e2e

# Build
pnpm build
```

## API

### POST /api/dimensioning/calc
Recebe `DimensioningInput` e retorna `DimensioningResult`.

### Server Action
`dimensionSystemAction` para uso em formulários React.

## Extensibilidade

### Catálogos
Módulos e inversores definidos em `calc.ts`. Fácil expansão.

### Tools Abstratas
Suporte para integração com APIs externas via `service.ts`.

### Persona System
Lógica condicional baseada em `persona` prop.

## Considerações de Segurança

- Validação rigorosa com Zod
- Sanitização de inputs numéricos
- Cálculos server-side
- Sem exposição de dados sensíveis

## Acessibilidade

- Labels associados a controles
- Navegação por teclado
- Mensagens de status com `aria-live`
- Contraste adequado com classes `.yello-*`