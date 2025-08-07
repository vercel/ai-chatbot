# Chatbot v2

This is a chatbot application that uses various AI models to provide responses.

## Getting Started

To get started with this project, you will need to:

1.  Install the dependencies: `pnpm install`
2.  Set up your environment variables by creating a `.env` file. See the "Environment Variables" section below for more details.
3.  Build the project: `pnpm run build`
4.  Start the development server: `pnpm run dev`

## Features

*   Chat with various AI models
*   Select your preferred model from a dropdown list
*   View chat history
*   User authentication

## Available Models

This application supports the following AI models:

| Name | Description |
| --- | --- |
| NIM Llama3 70b | For complex, multi-step tasks |
| Llama 3.3 70b Versatile | For complex, multi-step tasks with versatility |
| LLAMA 4 Scout 17B 16e-instruct | LLAMA 4 Scout 17B 16e-instruct model, built by Meta |
| Gemini 2.0 Flash-Lite | LLM model, built by Google |
| Gemini 1.5 Flash-8B | Built by Google, It is a small model designed for lower intelligence tasks. |
| Gemini 2.0 Flash | Built by Google, Next generation features, speed, thinking, realtime streaming |
| Gemini 2.0 Flash + Web Search | Built by Google, Next generation features, speed, thinking, realtime streaming + Google Search |
| NIM llama Maverick 17B 128e-instruct | NIM LLAMA Maverick 17B 128e-instruct model, built by Meta |
| Qwen QwQ 2b | Uses advanced reasoning and thinking for complex tasks |
| GPT-OSS 120b | Open source model by OpenAI, hosted on Groq |

## Environment Variables

This project requires the following environment variables to be set in a `.env` file:

```
# Drizzle
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=
POSTGRES_USER=
POSTGRES_HOST=
POSTGRES_PASSWORD=
POSTGRES_DATABASE=

# Next-Auth
# You can generate a new secret with `pnpm dlx openssl rand -base64 32`
AUTH_SECRET=
AUTH_URL=http://localhost:3000
# You can generate a new key with `pnpm dlx auth-helpers-key-generator`
AUTH_DRIZZLE_KEY=

# GitHub
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

# Turnstile (optional)
# You can get a new key from https://dash.cloudflare.com/?to=/:account/turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Uploadthing (optional)
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```
