# Blocos Reutilizáveis: Intent Input + Lead Validation

Este pacote fornece dois componentes reutilizáveis para coleta e validação de dados de intenção de leads em aplicações Next.js 15 com foco em energia solar.

## Dependências Necessárias

Antes de usar, instale as dependências adicionais:

```bash
pnpm add react-hook-form @hookform/resolvers
```

As seguintes dependências já estão incluídas no projeto:

- `zod` (para validação de schemas)
- `@testing-library/react` (para testes unitários)
- `vitest` (para execução de testes)
- `playwright` (para testes E2E)

## Componentes Incluídos

### 1. IntentInput

Formulário genérico e parametrizável para coleta de dados de intenção.

**Localização:** `components/intent/IntentInput.tsx`

**Props:**

```tsx
type IntentInputProps = {
  fields?: FieldConfig[];
  layout?: "compact" | "wide";
  defaultValues?: Partial<IntentData>;
  onValidated?: (result: LeadValidationResult) => void;
  submitMode?: "serverAction" | "api";
  className?: string;
};
```

**Uso Básico:**

```tsx
import IntentInput from "@/components/intent/IntentInput";

export default function MyPage() {
  return (
    <IntentInput
      layout="wide"
      onValidated={(result) => console.log(result)}
    />
  );
}
```

### 2. LeadValidationCard

Cartão de feedback estruturado para apresentar resultados de validação de leads.

**Localização:** `components/lead/LeadValidationCard.tsx`

**Props:**

```tsx
type LeadValidationCardProps = {
  result: LeadValidationResult;
  className?: string;
};
```

**Uso Básico:**

```tsx
import LeadValidationCard from "@/components/lead/LeadValidationCard";

export default function MyPage() {
  const [validationResult, setValidationResult] = useState<LeadValidationResult | null>(null);

  return validationResult ? (
    <LeadValidationCard result={validationResult} />
  ) : null;
}
```

## Tipos e Schemas

### IntentData

```tsx
type IntentData = {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  persona: "owner" | "integrator";
  goal: "viability" | "quote" | "support" | "other";
  notes?: string;
};
```

### LeadValidationResult

```tsx
type LeadValidationResult = {
  isValidLead: boolean;
  status: "approved" | "incomplete" | "unsupported_region";
  reasons: string[];
  normalized: {
    phone?: string;
    email?: string;
    address?: string;
    uf?: string;
  };
  next: {
    primaryCta: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
  };
  confidence: number;
};
```

## Lógica de Validação

A validação é determinística e inclui:

1. **Normalização de telefone:** Converte para formato E.164 (+55...)
2. **Validação de e-mail:** Regex simples para formato básico
3. **Extração de UF:** Identifica estado brasileiro no endereço
4. **Verificação de região:** Suporta apenas SP, RJ, MG, PR, SC, RS
5. **Regra mínima:** Endereço OU (e-mail + telefone) devem estar presentes
6. **Pontuação de confiança:** Baseada na completude dos dados (0-1)

## API Routes e Server Actions

### API Route

`POST /api/lead/validate`

Recebe `IntentData` e retorna `LeadValidationResult`.

### Server Action

`validateLeadAction(formData)` em `app/actions/validateLeadAction.ts`

Pode receber `FormData` ou `IntentData` diretamente.

## Página Demo

Uma página demo está disponível em `app/(journey)/journey/page.tsx` que demonstra o fluxo completo:

1. Preenchimento do formulário
2. Submissão e validação
3. Exibição do cartão de resultado

## Testes

### Unitários (Vitest + RTL)

- `tests/unit/intent-input.spec.tsx`: Testes do componente IntentInput
- `tests/unit/lead-validation-card.spec.tsx`: Testes do componente LeadValidationCard

**Execução:**

```bash
pnpm test
```

### E2E (Playwright)

- `tests/e2e/lead-validation.spec.ts`: Fluxo completo de validação

**Execução:**

```bash
pnpm test:e2e
```

## Stories (Storybook)

Stories estão disponíveis para ambos os componentes:

- `stories/IntentInput.stories.tsx`
- `stories/LeadValidationCard.stories.tsx`

**Execução:**

```bash
pnpm storybook
```

## Personalização

### Campos do Formulário

Os campos podem ser customizados via prop `fields`:

```tsx
const customFields: FieldConfig[] = [
  { name: "name", label: "Nome Completo", required: true },
  { name: "email", label: "E-mail Corporativo", type: "email" },
  // ... outros campos
];

<IntentInput fields={customFields} />
```

### Layout

- `"compact"`: 1 coluna
- `"wide"`: 2 colunas em telas maiores

### Modo de Submissão

- `"serverAction"`: Usa Server Action (recomendado)
- `"api"`: Usa fetch para API route

## Acessibilidade

- Labels e aria-attrs em todos os campos
- Foco visível com classe `.focus-yello`
- Estrutura semântica com headings e landmarks
- Suporte a navegação por teclado

## Estilos

Utiliza classes Tailwind compatíveis com o tema Yello:

- `.glass`: Fundo translúcido
- `.yello-stroke`: Bordas amarelas
- `.focus-yello`: Foco amarelo

## Integração com o Projeto

Os componentes são projetados para serem "props-first" e não acoplam a estados globais, facilitando reutilização em diferentes contextos da aplicação.
