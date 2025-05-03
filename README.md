<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and Electron, MCP ready AI Chatbot." src="public/images/chatbot.png">
  <h1 align="center">Chat SDK for MCP Host Application</h1>
</a>

<p align="center">
    Chat SDK is a free, open-source template built with Next.js, the AI SDK, and Electron, designed to integrate seamlessly with MCP host applications for building powerful desktop chatbot experiences.
</p>

<p align="center">
  <a href="https://chat-sdk.dev"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Changelogs for Customizing from Chat SDK

### May 3, 2025

- Initial release with Next.js 14 and Electron integration
  - Default package manager must be npm to navigate packages in the packed file
  - Add commands `e:dev`, `e:build` and `e:start` for build and dev with Electron
    - `npm run build && npm run e:build && npm run e:start` for building and running application
- Implemented basic chat functionality with Antrophic AI providers
- Added MCP Integration
  - Loading MCP servers from config file
  - Human-in-the-loop for asking permission
  - Customizable UI components for MCP tools
- Patched code from the origin code
- Trouble shootings for Development
  - `npm install --legacy-peer-deps`
  - `export NODE_OPTIONS="--network-family-autoselection-attempt-timeout=500"`

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

This template ships with [xAI](https://x.ai) `grok-2-1212` as the default chat model. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000).
