<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Next.js AI Chatbot</h1>
</a>

<p align="center">
  An Open-Source AI Chatbot Template Built With Next.js and the AI SDK by Vercel.
</p>

<p align="center">
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
  - Supports OpenAI (default), Anthropic, Cohere, and other model providers
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Vercel Postgres powered by Neon](https://vercel.com/storage/postgres) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [NextAuth.js](https://github.com/nextauthjs/next-auth)
  - Simple and secure authentication

## Model Providers

This template ships with OpenAI `gpt-4o` as the default. However, with the [AI SDK](https://sdk.vercel.ai/docs), you can switch LLM providers to [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Cohere](https://cohere.com/), and [many more](https://sdk.vercel.ai/providers/ai-sdk-providers) with just a few lines of code.

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET,OPENAI_API_KEY&envDescription=Learn%20more%20about%20how%20to%20get%20the%20API%20Keys%20for%20the%20application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI%20Chatbot&demo-description=An%20Open-Source%20AI%20Chatbot%20Template%20Built%20With%20Next.js%20and%20the%20AI%20SDK%20by%20Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&stores=[{%22type%22:%22postgres%22},{%22type%22:%22blob%22}])

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Next.js AI Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various OpenAI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000/).

## Streaming Pre-defined Text

You can simulate AI-like streaming responses with pre-defined text using the Vercel AI SDK. This is useful for testing or when you want to stream static content with controlled pacing.

### Basic Implementation

```typescript
const stream = createDataStream({
  async execute(dataStream) {
    // Start the message stream
    dataStream.write(
      formatDataStreamPart('start_step', { messageId: generateUUID() })
    )

    // Split text into words and stream each with a delay
    const words = text.split(/\s+/)
    for (const word of words) {
      dataStream.write(formatDataStreamPart('text', `${word} `))
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    // End the message stream
    dataStream.write(
      formatDataStreamPart('finish_message', {
        finishReason: 'stop',
        usage: { promptTokens: 55, completionTokens: 20 }
      })
    )
  }
})
```

### Advanced Implementation with Natural Pacing

For a more natural reading experience, you can stream text with different delays based on punctuation:

```typescript
async function streamWithPacing(text: string, dataStream: any) {
  // Split by sentences and punctuation
  const sentences = text.split(/([.!?,;\n]+)/)

  for (const part of sentences) {
    dataStream.write(formatDataStreamPart('text', part))

    // Dynamic delays based on punctuation
    if (part includes('\n')) {
      await new Promise(resolve => setTimeout(resolve, 400)) // Line break
    } else if (/[.!?]/.test(part)) {
      await new Promise(resolve => setTimeout(resolve, 200)) // End of sentence
    } else if (/[,;]/.test(part)) {
      await new Promise(resolve => setTimeout(resolve, 100)) // Mid-sentence pause
    } else {
      await new Promise(resolve => setTimeout(resolve, 50))  // Word spacing
    }
  }
}
```

### Usage Example

```typescript
const soneto = `
    Oh Marte rojo, astro de aridez,
    Desierto eterno bajo el cielo frío,
    Tu rostro escarlata es un desafío,
    Un sueño antiguo de la humanidad es.
`

const stream = createDataStream({
  async execute(dataStream) {
    dataStream.write(
      formatDataStreamPart('start_step', { messageId: generateUUID() })
    )

    await streamWithPacing(soneto, dataStream)

    dataStream.write(
      formatDataStreamPart('finish_message', {
        finishReason: 'stop',
        usage: { promptTokens: 55, completionTokens: 20 }
      })
    )
  }
})

// Create response stream
const responseStream = stream.pipeThrough(new TextEncoderStream())
return new Response(responseStream, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Vercel-AI-Data-Stream': 'v1'
  }
})
```

This implementation allows you to:

- Stream text word by word or sentence by sentence
- Add natural pacing with different delays
- Maintain proper streaming format compatible with Vercel AI SDK
- Control the streaming speed by adjusting delay values

Note: Adjust the delay times (in milliseconds) to achieve the desired reading pace for your application.
