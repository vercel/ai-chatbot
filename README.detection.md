# Detecção de Telhado - Módulo YSH AI

Este módulo implementa o JTBD "Detecção" para análise de imagens de telhados, identificando área útil e painéis solares existentes.

## Visão Geral

O módulo permite upload de imagens do telhado, análise automática via IA para segmentação de telhado e detecção de painéis, e geração de relatório com overlays e métricas.

## Arquitetura

- **Frontend**: Componentes React com drag-and-drop, validações e pré-visualização
- **Backend**: Server Actions e API routes para processamento
- **IA**: Integração com Vercel AI SDK, com fallback mock determinístico
- **Persona-aware**: Limites diferentes para owner (3 imagens) vs integrator (10 imagens)

## Como Usar

### 1. Página Demo
Acesse `/journey/detection` para testar o fluxo completo.

### 2. Integração em Componentes
```tsx
import { RoofUpload } from '@/components/detection/RoofUpload';
import { DetectionReport } from '@/components/detection/DetectionReport';

function MyComponent() {
  const [result, setResult] = useState(null);

  return result ? (
    <DetectionReport
      result={result}
      persona="owner"
      onProceed={() => router.push('/journey/analysis')}
      onBack={() => router.push('/journey')}
    />
  ) : (
    <RoofUpload
      onAnalyze={async (files) => {
        const formData = new FormData();
        files.forEach(file => {
          // Converter para File
          formData.append('files', file as any);
        });
        const response = await analyzeRoofAction(formData);
        if (response.success) setResult(response.data);
      }}
    />
  );
}
```

### 3. Server Action
```tsx
import { analyzeRoofAction } from '@/app/actions/analyzeRoofAction';

const result = await analyzeRoofAction(formData);
```

### 4. API Route
```bash
curl -X POST /api/detection/analyze \
  -F "files=@roof1.jpg" \
  -F "files=@roof2.jpg" \
  -F "persona=owner"
```

## Limites e Validações

- **Arquivos**: Apenas imagens (JPEG, PNG, WebP)
- **Tamanho**: ≤ 8MB por arquivo
- **Quantidade**:
  - Owner: ≤ 3 arquivos, ≤ 24MB total
  - Integrator: ≤ 10 arquivos, ≤ 80MB total
- **Resolução**: Recomendado ≥ 1024x768 para boa detecção

## Plugando Tools Reais

### 1. Roof Segment Tool
Configure `process.env.DETECTION_API_URL` para um serviço que implemente:
```typescript
POST /roof-segment
Body: { url: string, fileId?: string }
Response: {
  maskUrl: string,
  roof_coverage_m2: number,
  orientation?: string,
  tilt_deg?: number,
  confidence: number
}
```

### 2. Panel Detect Tool
```typescript
POST /panel-detect
Body: { url: string, fileId?: string }
Response: {
  bboxes: Array<{x,y,w,h,score?}>,
  panel_count: number,
  confidence: number
}
```

Se não configurado, usa fallback mock determinístico baseado no nome do arquivo.

## Testes

### Unitários
```bash
npm run test:unit tests/unit/roof-upload.spec.tsx
npm run test:unit tests/unit/detection-report.spec.tsx
```

### E2E
```bash
npm run test:e2e tests/e2e/detection.spec.ts
```

### Stories
```bash
npm run storybook
# Acesse /?path=/story/detection-roofupload--empty
```

## Estrutura de Arquivos

```
lib/detection/
├── types.ts          # Schemas Zod
├── fallback.ts       # Mock determinístico
└── service.ts        # Orquestração de tools

components/detection/
├── RoofUpload.tsx    # Upload com drag-and-drop
└── DetectionReport.tsx # Relatório com overlays

app/
├── actions/analyzeRoofAction.ts
├── api/detection/analyze/route.ts
└── journey/detection/page.tsx

tests/
├── unit/
├── e2e/
└── stories/
```

## Critérios de Aceitação

- ✅ Upload multi-imagem com pré-visualização
- ✅ Validações de tipo, tamanho e quantidade
- ✅ Análise retorna DetectionResult válido
- ✅ Relatório exibe overlays e métricas
- ✅ CTAs funcionais sem dead-ends
- ✅ A11y básico (foco, aria)
- ✅ Persona-aware (limites e features)
- ✅ Testes unitários e E2E passam
- ✅ Stories renderizam sem erros

## Próximos Passos

- Integrar com ferramentas de IA reais
- Adicionar geolocalização para orientação solar
- Suporte a vídeo/timelapse
- Otimização de performance para grandes imagens