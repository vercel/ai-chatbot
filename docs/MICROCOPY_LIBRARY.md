# Microcopy Library (PT-BR "Marrento Certo")

Biblioteca reutilizável de microcopys para produtos/funcionalidades com tonalidade confiante e ironia leve.

## Inventory

- titles
- subtitles
- ctas
- placeholders
- errors
- empty_states
- toasts
- tooltips
- validations_examples
- a11y
- rationale

## Titles

1. **Fala, {{1}}! Teu {{feature}} tá sob controle.**  
   Mobile: `{{feature}} ok`
2. **Painel de {{feature}} sem firula.**  
   Mobile: `{{feature}} direto`
3. **Tudo que gastou, escancarado.**  
   Mobile: `Gastou? tá aqui.`

## Subtitles

1. Organiza tudo sem perder tempo.
2. Porque você merece ver números claros.
3. Menos planilha, mais grana no bolso.

## CTAs

### Primary
1. **Bora começar**  
   Mobile: `Começar`
2. **Ver detalhes**  
   Mobile: `Detalhes`
3. **Salvar e partir**  
   Mobile: `Salvar`

### Secondary
1. **Depois eu vejo**  
   Mobile: `Depois`
2. **Editar rapidinho**  
   Mobile: `Editar`
3. **Voltar pro início**  
   Mobile: `Voltar`

### Destructive
1. **Apagar sem dó**  
   Mobile: `Apagar`
2. **Cancelar tudo**  
   Mobile: `Cancelar`
3. **Limpar histórico**  
   Mobile: `Limpar`

## Placeholders

### Search
1. Caça aqui...
2. Digita e eu encontro

### Email
1. seuemail@dominio.com
2. coloca o e-mail sem vergonha

### Phone
1. (00) 90000-0000
2. insere o número que atende

## Errors

- **empty:** Tá vazio. Coloca algo aí.
- **invalid:** Isso aí não cola. Confere o formato.
- **network:** Sem sinal. Tenta outra vez.
- **unauthorized:** Calma aí, você não tem passe pra isso.
- **notFound:** Sumiu? Esse conteúdo não vive mais aqui.
- **server:** Nosso lado deu ruim. Já estamos arrumando.
- **saldo_insuficiente:** Saldo curto. Acrescenta grana e volta.

## Empty States

### List
1. Nada por aqui… por enquanto.
2. Zerado. Dá o primeiro passo.

### No Results
1. Procurei, procurei e nada.
2. Nenhum match. Tenta outro termo.

### No Permission
1. Sem permissão, sem acesso.
2. Esse canto é VIP. Fala com o admin.

## Toasts

### Success
1. Feito, do jeito certo.
2. Pronto, missão cumprida.

### Error
1. Ixi, deu ruim. Olha o formulário.
2. Algo travou. Tenta de novo.

### Warn
1. Quase lá, confere os campos.
2. Cuidado, isso pode dar ruim.

### Info
1. Dica: dá pra importar planilha.
2. Atualizado agora há pouco.

## Tooltips

1. Importa um CSV e te poupa hora.
2. Clica pra ver detalhes sem bagunça.
3. Esse gráfico mostra o que você torrou no mês.

## Validation Examples

- cpf inválido
- valor acima do limite
- formato de e-mail errado
- telefone incompleto

## A11y

### Alt Samples
- Ícone de carteira com moeda
- Botão de sair com um X dentro de um círculo

### Aria Samples
- `aria-label="Fechar modal de {{feature}}"`
- `aria-live="assertive"` (para mensagens de erro em formulários)

## Rationale

- **Titles/Subtitles:** Frases curtas com personalidade, colocam o usuário no controle e usam leve ironia para aproximar.
- **CTAs:** Verbos de ação direta; versões curtas para mobile garantem clareza.
- **Placeholders & Tooltips:** Guiam sem jargões, mantêm tom informal e evitam ambiguidades.
- **Errors & Empty States:** Mensagens claras, anunciáveis e humanas; oferecem caminho ou solução.
- **Toasts:** Feedback imediato com tom confiante; informam sem poluir.
- **A11y:** Descrições objetivas e labels explícitos, compatíveis com leitores de tela.
- **Validações:** Exemplos comuns para reuso em formulários diversos, com linguagem inclusiva.

