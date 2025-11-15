# Documentação: Edições Parciais no Markdown Editor

## Visão Geral

Esta documentação descreve a implementação de edições parciais no Markdown Editor, que permite modificar apenas partes específicas de um documento sem regenerar o conteúdo completo. Esta funcionalidade preserva a formatação e alterações manuais do usuário, melhorando significativamente a experiência de edição.

## Problema Resolvido

### Problema Original

Quando o usuário solicitava edições específicas (ex: "troque o nome do autor para William Farias"), o sistema regenerava o documento inteiro, resultando em:

- **Perda de formatação**: Formatações manuais aplicadas pelo usuário eram perdidas
- **Perda de alterações**: Mudanças feitas manualmente no documento eram sobrescritas
- **Ineficiência**: Regeneração completa era desnecessária para mudanças pontuais
- **Truncamento de texto**: Em alguns casos, o texto novo era truncado (ex: "998" em vez de "99887766")

### Solução Implementada

A solução utiliza edições estruturadas que especificam exatamente quais partes do documento devem ser modificadas, incluindo:

- Posições de caractere precisas (`from` e `to`)
- Texto exato a ser substituído (`oldText`)
- Novo texto completo (`newText`)
- Validação para garantir que o `oldText` corresponde ao documento

## Arquitetura

### Componentes Envolvidos

1. **Servidor** (`artifacts/markdown/server.ts`)
   - Processa requisições de atualização
   - Usa `streamObject` para receber edições estruturadas da IA
   - Valida e envia edições via `data-markdownEdit`

2. **Cliente** (`artifacts/markdown/client.tsx`)
   - Recebe edições via `data-markdownEdit`
   - Armazena edições pendentes em `metadata.pendingEdits`

3. **Editor** (`components/markdown-editor.tsx`)
   - Processa edições pendentes
   - Aplica edições diretamente no markdown (não no HTML)
   - Atualiza o editor apenas após aplicar todas as edições

4. **Prompts** (`lib/ai/prompts.ts`)
   - Instrui a IA a retornar apenas mudanças específicas
   - Enfatiza a importância de capturar o texto exato incluindo caracteres de formatação

5. **Tipos** (`lib/types.ts`)
   - Define `MarkdownEdit` e `markdownEdit` em `CustomUIDataTypes`

## Funcionamento Detalhado

### Fluxo de Edição Parcial

```
1. Usuário solicita edição: "Troque o número do processo para 99887766"
   ↓
2. Servidor chama IA com prompt de edição parcial
   ↓
3. IA retorna edições estruturadas via streamObject:
   {
     edits: [{
       from: 57,
       to: 76,
       oldText: "[Número do Processo]",
       newText: "99887766"
     }]
   }
   ↓
4. Servidor valida e envia via data-markdownEdit
   ↓
5. Cliente armazena em metadata.pendingEdits
   ↓
6. Editor processa edições e aplica no markdown
   ↓
7. Editor atualiza apenas após todas as edições serem aplicadas
```

### Servidor: Processamento de Edições

O servidor usa `streamObject` para receber edições estruturadas da IA:

```typescript
const { fullStream, object } = streamObject({
  model: myProvider.languageModel("artifact-model"),
  system: updateMarkdownDocumentPrompt(document.content),
  prompt: `User request: ${description}...`,
  schema: editSchema,
});

// Aguarda o objeto completo antes de processar
let accumulatedObject: z.infer<typeof editSchema> | null = null;
for await (const delta of fullStream) {
  if (delta.type === "object") {
    accumulatedObject = delta.object as z.infer<typeof editSchema>;
  }
}

// Processa apenas após o stream terminar
if (finalObject?.edits && Array.isArray(finalObject.edits)) {
  for (const edit of finalObject.edits) {
    // Valida e envia edição
    dataStream.write({
      type: "data-markdownEdit",
      data: validEdit,
      transient: true,
    });
  }
}
```

**Importante**: O servidor aguarda o objeto completo antes de processar para evitar truncamento do `newText`.

### Cliente: Armazenamento de Edições

O cliente recebe edições e as armazena em metadata:

```typescript
if (streamPart.type === "data-markdownEdit") {
  const edit = streamPart.data as MarkdownEdit;
  
  setMetadata((currentMetadata) => ({
    ...currentMetadata,
    pendingEdits: [...(currentMetadata?.pendingEdits || []), edit],
  }));
}
```

### Editor: Aplicação de Edições

O editor processa edições pendentes e as aplica diretamente no markdown:

```typescript
useEffect(() => {
  if (!editor || !metadata?.pendingEdits || !content) {
    return;
  }

  const pendingEdits = metadata.pendingEdits;
  const sortedEdits = [...pendingEdits].sort((a, b) => b.from - a.from);
  
  let updatedMarkdown = content;
  let hasChanges = false;

  for (const edit of sortedEdits) {
    // Valida newText não está vazio
    if (!edit.newText || edit.newText.trim().length === 0) {
      continue;
    }

    // Verifica se posições são válidas
    if (edit.from < 0 || edit.to > updatedMarkdown.length || edit.from >= edit.to) {
      // Tenta encontrar por busca de texto
      const searchPos = updatedMarkdown.indexOf(edit.oldText);
      if (searchPos !== -1) {
        // Aplica edição
        const before = updatedMarkdown.slice(0, searchPos);
        const after = updatedMarkdown.slice(searchPos + edit.oldText.length);
        updatedMarkdown = before + edit.newText + after;
        hasChanges = true;
      }
      continue;
    }

    // Aplica edição usando posições
    const before = updatedMarkdown.slice(0, edit.from);
    const after = updatedMarkdown.slice(edit.to);
    updatedMarkdown = before + edit.newText + after;
    hasChanges = true;
  }

  // Atualiza editor apenas após todas as edições
  if (hasChanges) {
    const newHtmlContent = marked(updatedMarkdown) as string;
    editor.commands.setContent(newHtmlContent);
    onSaveContent(updatedMarkdown, false);
  }
}, [editor, metadata?.pendingEdits, content, onSaveContent]);
```

**Características importantes**:
- Edições são aplicadas em ordem reversa para manter posições corretas
- Matching flexível permite encontrar texto mesmo com pequenas variações
- Validação garante que `newText` não está vazio
- Editor é atualizado apenas uma vez após todas as edições

## Schema de Edições

### Estrutura do Schema Zod

```typescript
const editSchema = z.object({
  edits: z.array(
    z.object({
      from: z.number().describe(
        "Character position where the edit starts (0-based index)"
      ),
      to: z.number().describe(
        "Character position where the edit ends (exclusive, 0-based index)"
      ),
      oldText: z.string().describe(
        "The EXACT text that will be replaced, including ALL characters"
      ),
      newText: z.string().describe(
        "The complete new text that will replace the old text"
      ),
    })
  ),
});
```

### Tipo TypeScript

```typescript
export type MarkdownEdit = {
  from: number;
  to: number;
  oldText: string;
  newText: string;
};
```

## Prompts e Instruções da IA

### Prompt Principal

O prompt principal (`updateMarkdownDocumentPrompt`) inclui:

1. **Instruções críticas sobre captura de texto exato**:
   - Deve incluir TODOS os caracteres (colchetes, parênteses, aspas, espaços)
   - Verificação passo a passo antes de retornar

2. **Exemplos concretos**:
   - Exemplo 1: `[Número do Processo]` → `99887766`
   - Exemplo 2: `[Nome do Autor]` → `William Farias`
   - Exemplo 3: `[Data da Petição]` → `15/01/2024`

3. **Processo de verificação em 5 passos**:
   - Encontrar o texto no documento
   - Verificar caracteres antes e depois
   - Capturar texto completo incluindo formatação
   - Verificar correspondência caractere por caractere
   - Verificar que não cortou caracteres

### Prompt do Usuário no Servidor

O prompt do usuário reforça:
- `oldText` deve incluir TODOS os caracteres incluindo formatação
- Verificar correspondência exata antes de retornar
- Incluir brackets, parênteses, aspas e espaços quando fazem parte do texto

## Validações e Tratamento de Erros

### Validações no Servidor

1. **Validação de propriedades**:
   ```typescript
   if (
     edit &&
     typeof edit.from === "number" &&
     typeof edit.to === "number" &&
     typeof edit.oldText === "string" &&
     typeof edit.newText === "string" &&
     edit.newText.trim().length > 0
   ) {
     // Processa edição
   }
   ```

2. **Logs de debug**:
   ```typescript
   console.log("Processing edit:", {
     from: validEdit.from,
     to: validEdit.to,
     oldTextLength: validEdit.oldText.length,
     newTextLength: validEdit.newText.length,
     newTextPreview: validEdit.newText.substring(0, 50),
   });
   ```

### Validações no Editor

1. **Validação de newText vazio**:
   ```typescript
   if (!edit.newText || edit.newText.trim().length === 0) {
     console.warn("Edit has empty newText, skipping:", edit);
     continue;
   }
   ```

2. **Validação de posições**:
   ```typescript
   if (
     edit.from < 0 ||
     edit.to > updatedMarkdown.length ||
     edit.from >= edit.to
   ) {
     // Tenta encontrar por busca de texto
   }
   ```

3. **Matching flexível**:
   - Normaliza texto (remove espaços extras, normaliza parênteses)
   - Tenta encontrar texto mesmo com pequenas variações
   - Fallback para busca por conteúdo quando posições são inválidas

## Exemplos de Uso

### Exemplo 1: Trocar Número do Processo

**Entrada do usuário**: "Troque o número do processo para 99887766"

**Documento original**:
```markdown
Processo nº: [Número do Processo]
```

**Edição retornada pela IA**:
```typescript
{
  from: 57,
  to: 76,
  oldText: "[Número do Processo]",
  newText: "99887766"
}
```

**Resultado**:
```markdown
Processo nº: 99887766
```

### Exemplo 2: Trocar Nome do Autor

**Entrada do usuário**: "Troque o nome do autor para William Farias"

**Documento original**:
```markdown
Autor: [Nome do Autor]
```

**Edição retornada pela IA**:
```typescript
{
  from: 8,
  to: 24,
  oldText: "[Nome do Autor]",
  newText: "William Farias"
}
```

**Resultado**:
```markdown
Autor: William Farias
```

## Debug e Troubleshooting

### Logs Disponíveis

1. **Servidor** (terminal):
   ```
   Processing edit: {
     from: 57,
     to: 76,
     oldTextLength: 20,
     newTextLength: 8,
     newTextPreview: "99887766"
   }
   ```

2. **Cliente** (console do navegador):
   ```
   Edit received in client: {
     from: 57,
     to: 76,
     oldText: "[Número do Processo]",
     oldTextLength: 20,
     newText: "99887766",
     newTextLength: 8
   }
   ```

3. **Editor** (console do navegador):
   ```
   Processing edit in editor: {
     from: 57,
     to: 76,
     oldText: "[Número do Processo]",
     newText: "99887766"
   }
   ```

### Problemas Comuns e Soluções

1. **"Edit has empty newText, skipping"**
   - **Causa**: IA retornou `newText` vazio
   - **Solução**: Verificar prompt e instruções da IA

2. **"Could not find edit text in content"**
   - **Causa**: Problema de matching de texto
   - **Solução**: Verificar se `oldText` corresponde exatamente ao documento

3. **"Invalid edit positions"**
   - **Causa**: Posições incorretas da IA
   - **Solução**: Sistema tenta encontrar por busca de texto automaticamente

4. **Texto truncado (ex: "998" em vez de "99887766")**
   - **Causa**: Processamento de deltas parciais antes do objeto completo
   - **Solução**: Já corrigido - servidor agora aguarda objeto completo

5. **Caractere extra (ex: "99887766]" em vez de "99887766")**
   - **Causa**: IA não capturou o "]" no `oldText`
   - **Solução**: Melhorias no prompt para instruir captura exata de todos os caracteres

## Melhorias Implementadas

### 1. Aguardar Objeto Completo

**Antes**: Processava cada delta incrementalmente, causando truncamento
**Depois**: Aguarda o stream terminar antes de processar edições

```typescript
// Antes (causava truncamento)
for await (const delta of fullStream) {
  if (delta.type === "object") {
    // Processava imediatamente - objeto podia estar incompleto
  }
}

// Depois (aguarda objeto completo)
let accumulatedObject = null;
for await (const delta of fullStream) {
  if (delta.type === "object") {
    accumulatedObject = delta.object;
  }
}
// Processa apenas após stream terminar
```

### 2. Melhorias no Prompt

**Adicionado**:
- Instruções explícitas sobre capturar texto exato
- Exemplos concretos mostrando correto vs. incorreto
- Processo de verificação em 5 passos
- Enfatização sobre incluir todos os caracteres de formatação

### 3. Validações Robustas

**Adicionado**:
- Validação de `newText` não vazio
- Validação de posições válidas
- Matching flexível como fallback
- Logs detalhados para debug

## Arquivos Modificados

1. **`artifacts/markdown/server.ts`**
   - Modificado `onUpdateDocument` para usar `streamObject`
   - Adicionada validação de edições
   - Melhoradas descrições do schema
   - Melhorado prompt do usuário

2. **`artifacts/markdown/client.tsx`**
   - Adicionado processamento de `data-markdownEdit`
   - Armazenamento em `metadata.pendingEdits`
   - Logs de debug

3. **`components/markdown-editor.tsx`**
   - Adicionada lógica de processamento de edições pendentes
   - Aplicação de edições diretamente no markdown
   - Matching flexível e fallback
   - Logs de debug

4. **`lib/ai/prompts.ts`**
   - Melhorado `updateMarkdownDocumentPrompt` com instruções detalhadas
   - Adicionados exemplos concretos
   - Processo de verificação passo a passo

5. **`lib/types.ts`**
   - Adicionado tipo `MarkdownEdit`
   - Adicionado `markdownEdit` em `CustomUIDataTypes`

## Como Testar

### Teste Básico

1. **Criar uma petição**:
   ```
   "Cria uma petição de exemplo"
   ```

2. **Pedir edição específica**:
   ```
   "Troque o número do processo para 99887766"
   ```

3. **Verificar**:
   - Apenas o número do processo muda
   - Formatação preservada
   - Resto do documento intacto
   - Número completo aparece (não truncado)

### Teste com Múltiplas Edições

1. **Criar documento**
2. **Pedir múltiplas edições**:
   ```
   "Troque o nome do autor para William Farias e a data para 15/01/2024"
   ```
3. **Verificar**: Ambas as edições são aplicadas corretamente

### Debug

Para debug, verificar no console do navegador:
- `"Edit received in client:"` - Confirma recebimento
- `"Processing edit in editor:"` - Confirma processamento
- Verificar se `newText` está completo
- Verificar se `oldText` inclui todos os caracteres

## Referências

- [AI SDK - streamObject](https://sdk.vercel.ai/docs/reference/ai-sdk-core/stream-object)
- [Zod Schema Validation](https://zod.dev/)
- [Marked.js - Markdown Parser](https://marked.js.org/)

## Melhorias Futuras Possíveis

1. **Validação no servidor**: Verificar se `oldText` corresponde ao documento antes de enviar
2. **Correção automática**: Expandir `oldText` automaticamente se estiver incompleto
3. **Preview de edições**: Mostrar preview das edições antes de aplicar
4. **Histórico de edições**: Manter histórico de edições parciais aplicadas
5. **Rollback**: Permitir desfazer edições parciais específicas

