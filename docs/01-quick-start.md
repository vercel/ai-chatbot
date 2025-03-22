# Quick Start

The chatbot template is a web application built using [Next.js](https://nextjs.org) and the [AI SDK](https://sdk.vercel.ai) that can be used as a starting point for building your own AI applications. The template is designed to be easily customizable and extendable, allowing you to add new features and integrations as needed.

Deploying to [Vercel](https://vercel.com) is the quickest way to get started with the chatbot template, as it automatically sets up the project by connecting to integrations and deploys it to the cloud. You can then later develop the project locally and push changes to the Vercel project.

### Pre-requisites:

- Vercel account and [Vercel CLI](https://vercel.com/docs/cli)
- GitHub/GitLab/Bitbucket account
- API Keys from three AI model providers:
  - [xAI](https://console.x.ai/)
  - [OpenAI](https://platform.openai.com/account/api-keys)
  - [Fireworks](https://fireworks.ai/account/api-keys)

### Deploy to Vercel

To deploy the chatbot template to Vercel, click the button below to enter the 1-click deploy flow.

[<img src="https://vercel.com/button" alt="Deploy with Vercel"/>][deploy-url]

[deploy-url]: https://vercel.com/new/clone?repository-url=https://github.com/vercel/ai-chatbot&env=AUTH_SECRET&envDescription=Learn more about how to get the API Keys for the application&envLink=https://github.com/vercel/ai-chatbot/blob/main/.env.example&demo-title=AI Chatbot&demo-description=An Open-Source AI Chatbot Template Built With Next.js and the AI SDK by Vercel.&demo-url=https://chat.vercel.ai&products=[{"type":"integration","protocol":"ai","productSlug":"grok","integrationSlug":"xai"},{"type":"integration","protocol":"ai","productSlug":"api-key","integrationSlug":"groq"},{"type":"integration","protocol":"storage","productSlug":"neon","integrationSlug":"neon"},{"type":"blob"}]

During the flow, you will be prompted to create and connect to a postgres database and blob store. You will also need to provide environment variables for the application.

After deploying the project, you can access the chatbot template by visiting the URL provided by Vercel.

### Local Development

To develop the chatbot template locally, you can clone the repository and link it to your Vercel project. This will allow you to pull the environment variables from the Vercel project and use them locally.

```bash
git clone https://github.com/<username>/<repository>
cd <repository>
pnpm install

vercel link
vercel env pull
```

After linking the project, you can start the development server by running:

```bash
pnpm dev
```

The chatbot template will be available at `http://localhost:3000`.
