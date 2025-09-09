<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Chat SDK</h1>
</a>

<p align="center">
    Chat SDK is a free, open-source template built with Next.js and the AI SDK that helps you quickly build powerful chatbot applications.
</p>

<p align="center">
  <a href="https://chat-sdk.dev"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://sdk.vercel.ai/docs)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Supports xAI (default), OpenAI, Fireworks, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication

## Model Providers

This template uses the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) to access multiple AI models through a unified interface. The default configuration includes [xAI](https://x.ai) models (`grok-2-vision-1212`, `grok-3-mini-beta`) routed through the gateway.

### AI Gateway Authentication

**For Vercel deployments**: Authentication is handled automatically via OIDC tokens.

**For non-Vercel deployments**: You need to provide an AI Gateway API key by setting the `AI_GATEWAY_API_KEY` environment variable in your `.env.local` file.

With the [AI SDK](https://ai-sdk.dev/docs/introduction), you can also switch to direct LLM providers like [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://ai-sdk.dev/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI+Chatbot&demo-description=An+Open-Source+AI+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22grok%22%2C%22integrationSlug%22%3A%22xai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

For recursos de mapa e geocodificação do Google, defina `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` com a chave de API do Google Maps.

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000).

## Testing

### End-to-End Tests

O projeto inclui um conjunto completo de testes end-to-end (E2E) usando Playwright, cobrindo os principais fluxos de usuário da aplicação.

#### Scripts de Teste Disponíveis

```bash
# Executar todos os testes E2E
pnpm test:e2e

# Executar com interface visual
pnpm test:e2e:ui

# Executar em modo debug
pnpm test:e2e:debug

# Executar stories específicas
pnpm test:e2e:chat      # Testes de chat básico
pnpm test:e2e:journey   # Testes de journey completa
pnpm test:e2e:persona   # Testes de persona switching
pnpm test:e2e:canvas    # Testes de canvas interativo
pnpm test:e2e:upload    # Testes de upload de conta
pnpm test:e2e:auth      # Testes de autenticação
```

#### Stories de Teste Criadas

1. **Story Chat Básico** - Testa funcionalidades básicas de chat e mensagens
2. **Story Journey Completa** - Testa navegação através de todas as fases da jornada solar
3. **Story Persona Switching** - Testa alternância entre personas Owner/Integrator
4. **Story Canvas Interativo** - Testa funcionalidades do canvas para criação visual
5. **Story Upload de Conta** - Testa upload e processamento de contas de energia
6. **Story Autenticação** - Testa sistema completo de login/logout e segurança

**Total**: 78 testes automatizados cobrindo cenários críticos de usuário.

Para mais detalhes, consulte [`tests/e2e/README.md`](tests/e2e/README.md).

## Jornada Solar com Co-Agentes

Esta aplicação foi personalizada para oferecer uma experiência completa de pré-vendas para energia solar, utilizando um sistema de co-agentes especializados em cada fase da jornada do cliente.

### Co-Agentes da Jornada Solar

1. **Agente de Investigação** 🔍
   - Classifica intenções do usuário
   - Valida dados de leads
   - Analisa contas de luz e endereços

2. **Agente de Detecção** 📡
   - Identifica oportunidades no telhado
   - Detecta painéis solares existentes
   - Realiza análise visual remota

3. **Agente de Análise** 📊
   - Calcula consumo elétrico
   - Avalia viabilidade técnica
   - Realiza análise financeira e ROI

4. **Agente de Dimensionamento** 📏
   - Dimensiona o sistema fotovoltaico
   - Otimiza layout e configuração
   - Calcula especificações técnicas

5. **Agente de Recomendação** 🤝
   - Gera propostas personalizadas
   - Prepara contratos e documentação
   - Gerencia leads até o fechamento

### Funcionalidades Multimodais

- **Entrada multimodal**: Texto, imagens, arquivos
- **Análise de documentos**: Contas de luz, fotos de telhado
- **Interface visual**: Navegação intuitiva entre fases
- **Streaming em tempo real**: Respostas dos co-agentes
- **Persistência de dados**: Histórico completo das conversas
