# Chat → Agent (in ~10 minutes)

This repository shows how to turn Vercel's AI Chat SDK template into a **real AI agent**
by adding Bluebag — **without changing the UI**.

Same chat interface.
Same model.
But now the AI can actually *do things*.

---

## TL;DR

- Start with a normal AI chat app
- Add **one wrapper** around your `streamText` config
- The AI can now:
  - Execute tools in a sandbox
  - Read & write files
  - Run bash commands
  - Reason across real steps

No UI changes.
No framework rewrites.
No prompt hacks.

---

## What does "Chat → Agent" actually mean?

### A normal AI chat app

A typical AI chat app (including the default Vercel AI Chat SDK template):

- Generates text only
- Cannot run commands
- Cannot create or modify files
- Cannot execute multi-step actions

Even if it *says* it did something — it didn't.
It's just text.

---

### This repo (with Bluebag)

With Bluebag added under the hood, the same chat UI now:

- Uses tools (bash, scripts, file I/O)
- Executes real actions in a sandbox
- Reads and writes files
- Reasons across multiple steps

In other words:

**It behaves like an agent, not just a chatbot.**

---

## Try this prompt

Once the app is running, paste this into the chat:

> Create a file called plan.md with a 3-step startup launch plan, then update it with one more step.

If that works, you're no longer talking to a chatbot.

---

## How does this work?

This project is built directly on top of the official Vercel AI Chat SDK template.

Normally, the flow looks like this:

```
User → LLM → text response
```

With Bluebag added:

```
User → LLM
     → Bluebag (agent skills + tools + sandbox)
     → LLM executes real actions
     → text response
```

The UI stays exactly the same.

---

## The changes we made

### 1. Install the Bluebag SDK

```bash
pnpm add @bluebag/ai-sdk
```

### 2. Add your API key to `.env.local`

```bash
BLUEBAG_API_KEY=bb_xxx
```

### 3. Wrap your streamText config (one file change)

In `app/(chat)/api/chat/route.ts`:

```ts
import { bluebag } from "@bluebag/ai-sdk";

// Create the enhance function with your API key
const enhance = bluebag(process.env.BLUEBAG_API_KEY ?? "");

// Wrap your existing streamText config
const enhancedConfig = await enhance({
  model: getLanguageModel(selectedChatModel),
  system: systemPrompt({ selectedChatModel, requestHints }),
  messages: modelMessages,
  tools: {
    getWeather,
    createDocument: createDocument({ session, dataStream }),
    updateDocument: updateDocument({ session, dataStream }),
    requestSuggestions: requestSuggestions({ session, dataStream }),
  },
  // ... other config options
});

// Pass the enhanced config to streamText
const result = streamText(enhancedConfig);
```

That's it. The `enhance()` wrapper:

- Injects agent skills (file I/O, bash execution, etc.)
- Augments the system prompt with agent capabilities
- Connects the model to a real sandbox
- Enables multi-step reasoning across actions

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/ohansFavour/chat-to-agent
cd chat-to-agent
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set environment variables

Copy the example env file and fill in your keys:

```bash
cp .env.example .env.local
```

Required variables:

```bash
AUTH_SECRET=<generate with: openssl rand -base64 32>
POSTGRES_URL=<your PostgreSQL connection string>
BLUEBAG_API_KEY=bb_xxx
```

#### How to get your Bluebag API key

1. Go to [bluebag.ai](https://www.bluebag.ai/) and sign up or log in
2. Navigate to the **API Keys** section in your dashboard
3. Click **Create API Key** and give it a name (e.g., `chat-to-agent`)
4. Copy the key immediately — you won't see it again
5. Add it to your `.env.local` as `BLUEBAG_API_KEY=bb_xxx`

> ⚠️ Keep your API key server-side only. Never expose it in client-side code.

For more details, see the [Bluebag documentation](https://www.bluebag.ai/docs/quickstart/ai-sdk).

Optional (for full functionality):

```bash
AI_GATEWAY_API_KEY=<from https://vercel.com/ai-gateway>
BLOB_READ_WRITE_TOKEN=<from Vercel Blob>
REDIS_URL=<your Redis connection string>
```

### 4. Run database migrations

```bash
pnpm db:migrate
```

### 5. Run the app

```bash
pnpm dev
```

Open http://localhost:3000 and start chatting.

---

## What this repo is (and isn't)

### This is

- A minimal proof-of-concept
- A teaching repository
- A concrete demo of agentic behavior
- Something you can understand in minutes

### This is not

- A framework
- A production starter
- A full product
- A replacement for your stack

---

## Why this repo exists

Most AI chat apps today are still text-only systems.

This repo demonstrates how little it takes to cross the line from:

> "The AI says it did something"

to:

> "The AI actually did something"

---

## Credits

- Built on the [Vercel AI Chat SDK template](https://github.com/vercel/ai-chatbot)
- Agent capabilities powered by [Bluebag](https://bluebag.dev)

---

## License

MIT
