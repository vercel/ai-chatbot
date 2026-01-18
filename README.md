<a href="https://chat.vercel.ai/">
  <img alt="Next.js 14 and App Router-ready AI chatbot." src="app/(chat)/opengraph-image.png">
  <h1 align="center">Agent RBP</h1>
</a>

<p align="center">
    Agent RBP is a free, open-source React Best Practices Agent built on 10+ years of real-world experience distilled in Skills powered by Bluebag
</p>

<p align="center">
  <a href="https://x.com/rauchg/status/2011179888976544134"><strong>Official Tweet</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>



### Agent Skills via [Bluebag](https://www.bluebag.ai)

To load and use Skills in the ai-sdk agent, this repo uses [Bluebag](https://www.bluebag.ai) for managing the entire Skills lifecycle, and Vercel's ai-sdk for the actual agent plumbing.


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



## Credits

- Built on the [Vercel AI Chat SDK template](https://github.com/vercel/ai-chatbot)
- Agent Skills capabilities powered by [Bluebag](https://bluebag.dev)

---

## License

MIT
