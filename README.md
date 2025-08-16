# Current state
- `azd` by default doesn't support `pnpm`
- Created Dockerfile to hopefully guide it -- haven't tried
- `pnpm` build isn't super clean, still some stuff with warnings
- Docker build working - `docker build -t ai-chatbot:dev .`
- Docker run working
  - `docker run -d --name ai-chatbot-test -p 3000:80 -e NEXTAUTH_URL=http://localhost:3000 -e AUTH_SECRET=8cbed01116077e9906d52fcdd5a778cd -e AZURE_OPENAI_RESOURCE_NAME=aoai-services-22 -e AZURE_OPENAI_API_KEY=KEY -e AZURE_OPENAI_DEPLOYMENT_CHAT=gpt-4o-mini -e AZURE_OPENAI_DEPLOYMENT_TITLE=gpt-4o-mini -e POSTGRES_URL='postgresql://saam:PASS@db-saam.postgres.database.azure.com:5432/postgres?sslmode=require' ai-chatbot:dev`

## Issues
  - Next Auth failing / looping - can't load homepage due to too many redirects, browser stops
  - Copilot did some interesting stuff in `providers.ts` to allow Docker build to complete without AZURE env
    - suggest we just set dummy env vars in the Docker script?
  - `azd up` deployment still not tested/working
  - Dockerfile / .dockerignore could do with a review



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

## Installation
- Create a minimal Postgres instance in Azure, using Password-based auth
- Create an Azure OpenAI instance, or re-use existing
- Copy `.env.example` to `.env.local` and populate with settings from the above
- Install: `pnpm install`
- Run the migration: `pnpm tsx lib/db/migrate.ts`
- Run the app: `pnpm dev`

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
