<img alt="Next.js 13 and app template Router-ready AI chatbot." src="https://chat.vercel.ai/opengraph-image.png">
<h1 align="center">Next.js AI Chatbot</h1>

<p align="center">
  An open-source AI chatbot app template built with Next.js, the Vercel AI SDK, OpenAI, upstash and Clerk.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a> ·
  <a href="#credits"><strong>Credits</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
- React Server Components (RSCs), Suspense, and Server Actions
- [Vercel AI SDK](https://sdk.vercel.ai/docs) for streaming chat UI
- Support for OpenAI (default), Anthropic, Hugging Face, or custom AI chat models and/or LangChain
- Edge runtime-ready
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - [Radix UI](https://radix-ui.com) for headless component primitives
  - Icons from [Phosphor Icons](https://phosphoricons.com)
- Chat History, rate limiting, and session storage with [Upstash](https://upstash.com/)
- [Clerk](https://clerk.com/) for authentication

## Model Providers

This template ships with OpenAI `gpt-3.5-turbo` as the default. However, thanks to the [Vercel AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [Anthropic](https://anthropic.com), [Hugging Face](https://huggingface.co), or using [LangChain](https://js.langchain.com) with just a few lines of code.

## upstash

You will need to set up an upstash account and create a Redis Database. Only takes a few clicks!

Remember to update your environment variables (`UPSTASH_URL`, `UPSTASH_KEY`) in the `.env` file with the appropriate credentials provided during the setup process.

## Clerk

You will need to set up a Clerk account and create a Clerk application. This also only takes a few clicks!

Remember to update your environment variables (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) in the `.env` file with the appropriate credentials provided during the setup process.

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

## Credits

This template is a fork of the [main AI Chatbot from the Vercel](https://github.com/vercel-labs/ai-chatbot) team and other contributors. It has been modified to use Upstash and Clerk.

[View Origanal template](https://github.com/vercel-labs/ai-chatbot)
