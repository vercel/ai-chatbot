# Documentação: Markdown Editor com Tiptap

## Visão Geral

O `MarkdownEditor` é um componente React que fornece uma interface de edição rica para documentos markdown usando o Tiptap, um editor de texto baseado em ProseMirror. Este editor foi integrado ao sistema de artifacts do chatbot, permitindo a criação e edição de documentos jurídicos e outros conteúdos em formato markdown.

## Arquitetura

### Componentes Principais

1. **`MarkdownEditor`** (`components/markdown-editor.tsx`)
   - Componente principal que gerencia o editor Tiptap
   - Converte markdown para HTML e vice-versa
   - Gerencia o estado do editor e sincronização com o conteúdo

2. **`TiptapToolbar`** (dentro de `markdown-editor.tsx`)
   - Barra de ferramentas com botões de formatação
   - Fornece interface visual para todas as funcionalidades do editor

3. **`markdownArtifact`** (`artifacts/markdown/client.tsx`)
   - Configuração do artifact para documentos markdown
   - Define ações, toolbar e comportamento do artifact

4. **`markdownDocumentHandler`** (`artifacts/markdown/server.ts`)
   - Handler do servidor para criação e atualização de documentos
   - Gerencia streaming de conteúdo do AI

## Funcionamento do MarkdownEditor

### Inicialização

O editor é inicializado usando o hook `useEditor` do Tiptap com as seguintes extensões:

```typescript
const editor = useEditor({
  extensions: [
    StarterKit,           // Extensões básicas (negrito, itálico, listas, etc.)
    Link.configure({      // Extensão de links
      openOnClick: false,
      HTMLAttributes: {
        class: "text-primary underline",
      },
    }),
    Underline,            // Extensão de sublinhado
  ],
  content: htmlContent,   // Conteúdo inicial em HTML
  immediatelyRender: false,
  // ...
});
```

### Conversão Markdown ↔ HTML

O editor trabalha internamente com HTML, mas recebe conteúdo em markdown. A conversão é feita usando a biblioteca `marked`:

```typescript
const htmlContent = useMemo(() => {
  if (!content) {
    return "";
  }
  try {
    return marked(content) as string;  // Converte markdown para HTML
  } catch {
    return content;
  }
}, [content]);
```

Quando o usuário edita, o conteúdo é salvo como HTML:

```typescript
onUpdate: ({ editor: editorInstance }) => {
  const html = editorInstance.getHTML();
  onSaveContent(html, true);  // Salva como HTML
}
```

### Sincronização de Conteúdo

O editor sincroniza o conteúdo em três situações:

1. **Durante streaming**: Quando o AI está gerando conteúdo
2. **Quando o conteúdo muda**: Quando há atualizações externas
3. **Cleanup**: Destrói o editor quando o componente é desmontado

```typescript
useEffect(() => {
  if (editor && htmlContent) {
    const currentContent = editor.getHTML();
    
    if (status === "streaming" || currentContent !== htmlContent) {
      editor.commands.setContent(htmlContent);
    }
  }
}, [htmlContent, status, editor]);
```

## Integração com Artifacts

### Fluxo de Criação de Documento

1. **Usuário solicita criação**: O usuário pede para criar um documento (ex: "Cria uma petição")
2. **AI chama tool**: O AI chama `createDocument` com `kind: "markdown"`
3. **Server handler**: `markdownDocumentHandler.onCreateDocument` é executado
4. **Streaming**: O conteúdo é gerado em chunks e enviado via `data-markdownDelta`
5. **Client recebe**: `markdownArtifact.onStreamPart` recebe os chunks
6. **Editor atualiza**: O `MarkdownEditor` recebe o conteúdo e atualiza em tempo real

### Estrutura do Artifact

```typescript
export const markdownArtifact = new Artifact<"markdown">({
  kind: "markdown",
  description: "Useful for creating legal documents...",
  
  // Inicialização (sem metadata necessário)
  initialize: () => {},
  
  // Handler de streaming
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "data-markdownDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: draftArtifact.content + streamPart.data,
        status: "streaming",
      }));
    }
  },
  
  // Renderiza o editor
  content: ({ ...props }) => {
    return (
      <div className="px-1">
        <MarkdownEditor {...props} />
      </div>
    );
  },
  
  // Ações disponíveis (Undo, Redo, Copy)
  actions: [...],
  
  // Toolbar do artifact (melhorar documento)
  toolbar: [...],
});
```

### Props Passadas ao Editor

O `MarkdownEditor` recebe as seguintes props do artifact:

- `content`: String com o conteúdo markdown/HTML
- `onSaveContent`: Callback para salvar alterações
- `status`: "streaming" | "idle"
- `isCurrentVersion`: Se é a versão atual
- `currentVersionIndex`: Índice da versão atual
- `suggestions`: Sugestões de edição

## Toolbar do Tiptap

### Implementação

A toolbar foi implementada como um componente separado `TiptapToolbar` que recebe a instância do editor como prop.

### Estrutura da Toolbar

A toolbar está organizada em grupos separados por divisores visuais:

#### 1. Formatação de Texto
- **Negrito** (`toggleBold`): Aplica/remove formatação em negrito
- **Itálico** (`toggleItalic`): Aplica/remove formatação em itálico
- **Sublinhado** (`toggleUnderline`): Aplica/remove sublinhado
- **Tachado** (`toggleStrike`): Aplica/remove texto tachado
- **Código Inline** (`toggleCode`): Formata texto como código inline

#### 2. Títulos
- **H1 a H6** (`toggleHeading`): Converte parágrafo em título de diferentes níveis

#### 3. Listas
- **Lista não ordenada** (`toggleBulletList`): Cria lista com marcadores
- **Lista ordenada** (`toggleOrderedList`): Cria lista numerada

#### 4. Outros Elementos
- **Link** (`setLink`): Adiciona/edita links (abre prompt para URL)
- **Bloco de código** (`toggleCodeBlock`): Cria bloco de código
- **Citação** (`toggleBlockquote`): Cria citação em bloco
- **Linha horizontal** (`setHorizontalRule`): Insere linha divisória

#### 5. Ações
- **Desfazer** (`undo`): Desfaz última ação
- **Refazer** (`redo`): Refaz ação desfeita

### Estados Ativos

Cada botão verifica se a formatação está ativa no texto selecionado:

```typescript
<Button
  className={cn(
    editor.isActive("bold") && "bg-accent text-accent-foreground"
  )}
  onClick={() => editor.chain().focus().toggleBold().run()}
  disabled={!editor.can().chain().focus().toggleBold().run()}
>
  <Bold className="h-4 w-4" />
</Button>
```

- `editor.isActive("bold")`: Verifica se o texto selecionado está em negrito
- `editor.can().chain().focus().toggleBold().run()`: Verifica se a ação é possível
- Classes condicionais aplicam estilo visual quando ativo

### Funcionalidade de Links

A funcionalidade de links tem um comportamento especial:

```typescript
const setLink = () => {
  const previousUrl = editor.getAttributes("link").href;
  const url = window.prompt("URL", previousUrl);

  if (url === null) {
    return;  // Usuário cancelou
  }

  if (url === "") {
    // Remove link se URL vazia
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }

  // Adiciona ou atualiza link
  editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
};
```

## Extensões do Tiptap Utilizadas

### StarterKit
Inclui extensões básicas:
- `Bold` - Negrito
- `Italic` - Itálico
- `Strike` - Tachado
- `Code` - Código inline
- `Heading` - Títulos (H1-H6)
- `BulletList` - Lista não ordenada
- `OrderedList` - Lista ordenada
- `Blockquote` - Citações
- `CodeBlock` - Blocos de código
- `HorizontalRule` - Linha horizontal
- `History` - Histórico (undo/redo)

### Link Extension
- Permite adicionar links clicáveis
- Configurado para não abrir automaticamente ao clicar
- Estilizado com classes Tailwind

### Underline Extension
- Adiciona suporte a texto sublinhado
- Não incluído no StarterKit por padrão

## Estilização

### Editor
O editor usa classes Tailwind Typography (prose) para estilização:

```typescript
class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl dark:prose-invert max-w-none focus:outline-none px-4 py-8 md:p-20"
```

- `prose`: Aplica estilos de tipografia
- `dark:prose-invert`: Suporte a tema escuro
- Padding responsivo para diferentes tamanhos de tela

### Toolbar
A toolbar usa componentes do design system do projeto:

- `Button` com variante `ghost` e tamanho `icon`
- Separadores visuais entre grupos
- Estados ativos com `bg-accent text-accent-foreground`
- Layout flexível com `flex-wrap` para responsividade

## Fluxo Completo de Uso

1. **Usuário solicita documento**: "Cria uma petição de exemplo"
2. **AI processa**: Identifica necessidade de documento markdown
3. **Tool é chamado**: `createDocument(title: "Petição de exemplo", kind: "markdown")`
4. **Server gera conteúdo**: `markdownDocumentHandler` usa AI para gerar markdown
5. **Streaming começa**: Chunks são enviados via `data-markdownDelta`
6. **Artifact recebe**: `onStreamPart` acumula conteúdo
7. **Editor renderiza**: `MarkdownEditor` converte markdown para HTML e exibe
8. **Usuário edita**: Toolbar permite formatação rica
9. **Conteúdo salva**: Alterações são salvas como HTML
10. **Versões**: Sistema mantém histórico de versões

## Melhorias Futuras Possíveis

1. **Mais extensões**: Adicionar tabelas, imagens, etc.
2. **Atalhos de teclado**: Implementar shortcuts (Ctrl+B, Ctrl+I, etc.)
3. **Menu de contexto**: Menu ao clicar com botão direito
4. **Exportação**: Exportar para PDF, DOCX, etc.
5. **Colaboração**: Edição simultânea (se necessário)
6. **Sugestões inline**: Mostrar sugestões diretamente no editor

## Dependências

- `@tiptap/react`: ^3.10.7
- `@tiptap/starter-kit`: ^3.10.7
- `@tiptap/extension-link`: ^3.10.7
- `@tiptap/extension-underline`: ^3.10.7
- `marked`: ^17.0.0
- `lucide-react`: ^0.446.0 (ícones)

## Referências

- [Documentação Tiptap](https://tiptap.dev/)
- [ProseMirror](https://prosemirror.net/)
- [Marked.js](https://marked.js.org/)

