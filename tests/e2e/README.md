# YSH AI Chatbot - End-to-End Test Stories

Este documento descreve as histórias de teste end-to-end (E2E) criadas para o sistema YSH AI Chatbot, cobrindo os principais fluxos de usuário e funcionalidades críticas.

## Visão Geral

As stories foram desenvolvidas usando Playwright com TypeScript, seguindo padrões BDD (Behavior Driven Development) com cenários Given-When-Then. Cada story foca em um aspecto específico da experiência do usuário.

## Stories Criadas

### 1. Story Chat Básico (`story-chat-basico.spec.ts`)

**Objetivo**: Testar a funcionalidade básica de chat e interações com o usuário.

**Cenários cobertos**:

- Carregamento da interface de chat
- Envio de mensagens simples
- Histórico de conversas
- Indicadores de digitação
- Mensagens longas
- Limpeza de histórico
- Navegação entre chats
- Respostas do sistema
- Tratamento de erros

### 2. Story Journey Completa (`story-journey-completa.spec.ts`)

**Objetivo**: Testar a navegação completa através das fases do journey do usuário.

**Cenários cobertos**:

- Carregamento da página inicial do journey
- Navegação entre fases (Investigation → Detection → Analysis → Dimensioning → Recommendation → LeadMgmt)
- Validação de progresso visual
- Persistência de dados entre fases
- Cartões específicos de cada fase
- Navegação sequencial e não-linear
- Estados de loading
- Tratamento de erros de navegação

### 3. Story Persona Switching (`story-persona-switching.spec.ts`)

**Objetivo**: Testar a alternância entre personas (Owner/Integrator) e suas personalizações.

**Cenários cobertos**:

- Interface de seleção de persona
- Alternância entre Owner e Integrator
- Personalização da UI baseada na persona
- Filtros de funcionalidades
- Persistência da seleção
- Navegação personalizada
- Conteúdo específico por persona
- Validação de permissões

### 4. Story Canvas Interativo (`story-canvas-interativo.spec.ts`)

**Objetivo**: Testar a funcionalidade do canvas interativo para criação visual de propostas.

**Cenários cobertos**:

- Carregamento da interface do canvas
- Criação de artefatos (texto, código, propostas)
- Arrastar e redimensionar elementos
- Conexões entre artefatos
- Edição de conteúdo
- Seleção múltipla
- Exclusão de artefatos
- Salvamento e carregamento
- Zoom e pan
- Execução de código

### 5. Story Upload de Conta (`story-upload-conta.spec.ts`)

**Objetivo**: Testar o upload e processamento de contas de energia.

**Cenários cobertos**:

- Interface de upload
- Seleção de arquivos via botão
- Drag and drop
- Validação de tipos de arquivo
- Validação de tamanho
- Progresso do upload
- Extração de dados
- Preview processado
- Edição manual de dados
- Geração de análise
- Salvamento de dados
- Cancelamento de upload
- Múltiplos arquivos
- Histórico de uploads
- Download de dados
- Tratamento de erros
- Tentativa de reenvio

### 6. Story Autenticação (`story-autenticacao.spec.ts`)

**Objetivo**: Testar o sistema completo de autenticação e segurança.

**Cenários cobertos**:

- Carregamento da página de login
- Credenciais inválidas
- Login com credenciais válidas
- Validação de formato de email
- Validação de senha obrigatória
- Opção "Lembrar de mim"
- Recuperação de senha
- Criação de nova conta
- Manutenção de sessão
- Logout
- Proteção de rotas
- Login com provedores externos
- Loading durante autenticação
- Alteração de senha
- Expiração de sessão
- Autenticação de dois fatores
- Reenvio de código 2FA

## Estrutura dos Testes

### Padrões Utilizados

1. **Setup consistente**: Cada teste começa navegando para a página relevante
2. **Seletores robustos**: Uso de `data-testid` com fallbacks para seletores CSS/text
3. **Espera adequada**: Uso de `waitForTimeout` e verificações de visibilidade
4. **Tratamento de condicionais**: Verificações `if (await element.isVisible())` para funcionalidades opcionais
5. **Cenários realistas**: Testes baseados em comportamentos reais do usuário

### Estratégias de Seleção

```typescript
// Estratégia primária: data-testid
await expect(page.locator('[data-testid="upload-area"]')).toBeVisible();

// Fallback: seletores CSS ou texto
page.locator('[data-testid="upload-area"]').or(
  page.locator('text=Arraste').or(page.locator('text=Selecione'))
);
```

### Tratamento de Estados Assíncronos

```typescript
// Aguardar carregamento
await page.waitForLoadState('networkidle');

// Aguardar processamento específico
await page.waitForTimeout(3000);

// Verificar estados dinâmicos
if (await processingIndicator.isVisible()) {
  await expect(processingIndicator).toBeVisible();
}
```

## Cobertura de Cenários

### Funcionalidades Críticas

- ✅ Autenticação e autorização
- ✅ Navegação e roteamento
- ✅ Upload e processamento de arquivos
- ✅ Interação com canvas
- ✅ Persistência de dados
- ✅ Tratamento de erros
- ✅ Estados de loading

### Tipos de Usuário

- ✅ Usuário não autenticado
- ✅ Usuário Owner (dono de imóvel)
- ✅ Usuário Integrator (integrador solar)
- ✅ Usuário com sessão expirada

### Cenários de Erro

- ✅ Credenciais inválidas
- ✅ Arquivos não suportados
- ✅ Conexões de rede
- ✅ Timeout de sessão
- ✅ Dados corrompidos

## Execução dos Testes

### Pré-requisitos

```bash
# Instalar dependências
pnpm install

# Configurar ambiente de teste
# (verificar playwright.config.ts)
```

### Executar Todos os Testes

```bash
# Executar todas as stories
pnpm test:e2e

# Executar com interface visual
pnpm test:e2e:ui

# Executar em modo debug
pnpm test:e2e:debug
```

### Executar Stories Específicas

```bash
# Chat básico
pnpm test:e2e:chat

# Journey completa
pnpm test:e2e:journey

# Persona switching
pnpm test:e2e:persona

# Canvas interativo
pnpm test:e2e:canvas

# Upload de conta
pnpm test:e2e:upload

# Autenticação
pnpm test:e2e:auth
```

## Relatórios e Resultados

Os testes geram relatórios HTML automaticamente em `test-results/`. Para visualizar:

```bash
# Abrir relatório mais recente
pnpm test:e2e --reporter=html
```

## Manutenção

### Adição de Novos Testes

1. Seguir a estrutura existente
2. Usar seletores robustos com fallbacks
3. Incluir cenários de erro
4. Documentar cenários no README

### Atualização de Seletores

- Preferir `data-testid` para novos elementos
- Manter fallbacks para retrocompatibilidade
- Atualizar testes quando a UI mudar

### Monitoramento de Cobertura

- Revisar cobertura regularmente
- Adicionar testes para novas funcionalidades
- Remover testes obsoletos

## Integração com CI/CD

Os testes estão configurados para execução em pipeline de CI/CD através do GitHub Actions. Configurações em `.github/workflows/test.yml`.

### Gatilhos de Execução

- Push para branches principais
- Pull requests
- Releases
- Execução manual

### Estratégias de Paralelização

- Testes divididos por story
- Execução em múltiplos navegadores
- Sharding para reduzir tempo total

## Boas Práticas

### Desenvolvimento de Testes

1. **Cenários realistas**: Testar fluxos reais do usuário
2. **Independência**: Cada teste deve ser executável isoladamente
3. **Manutenibilidade**: Código limpo e bem documentado
4. **Performance**: Minimizar esperas desnecessárias
5. **Confiabilidade**: Seletores robustos e tratamento de race conditions

### Debugging

1. Usar `--debug` para execução passo-a-passo
2. Verificar seletores no DevTools
3. Adicionar screenshots em caso de falha
4. Usar `console.log` para debugging

### Organização

1. Um arquivo por story principal
2. Nomenclatura descritiva
3. Comentários explicativos
4. Separação de concerns

Este conjunto de stories fornece cobertura abrangente dos fluxos críticos do usuário, garantindo qualidade e confiabilidade do sistema YSH AI Chatbot.
