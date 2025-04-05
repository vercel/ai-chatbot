
<div align="center">
<p align="center">
  <a href="https://arcade.dev/">
    <h1 align="center">Arcade Chatbot</h1>
  </a>
</p>
<img width="700" height="500" alt="Screenshot 2025-04-05 at 1 58 21 PM" src="https://github.com/user-attachments/assets/b6251cab-d17a-40a6-b052-b4c989340ca6" />
</div>

<p align="center">
  A chatbot interface for Arcade tools, built with Next.js and the Arcade SDK.
  Based on the <a href="https://github.com/vercel/ai-chatbot">Vercel AI Chatbot</a> template.
</p>



<p align="center">
  <a href="#features">Features</a> •
  <a href="#prerequisites">Prerequisites</a> •
  <a href="#installation">Installation</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#development">Development</a> •
  <a href="#deployment">Deployment</a>
</p>

## Features

- 🤖 Interactive chatbot interface for Arcade tools
- ⚡️ Built with Next.js for optimal performance
- 🛠 Seamless integration with Arcade SDK
- 🔄 Support for both cloud and local development environments
- 💬 Real-time chat interactions
- 🎨 Clean and intuitive user interface

## Prerequisites

Before you begin, ensure you have installed:

- Node.js 18.x or later
- pnpm (recommended) or another package manager
- An Arcade account with API access

## Installation

1. Clone the repository:

```bash
git clone https://github.com/arcadeai/arcade-chatbot.git
cd arcade-chatbot
```

2. Install dependencies:

```bash
pnpm install
```

## Configuration

### Environment Variables

Copy the [`.env.example`](.env.example) file to create your own `.env`:

```bash
cp .env.example .env
```

Configure the following environment variables:

| Variable            | Required | Default   | Description                 |
| ------------------- | -------- | --------- | --------------------------- |
| `ARCADE_API_KEY`    | Yes      | -         | Your Arcade API key      |
| `ARCADE_ENGINE_URL` | No       | Cloud URL | Engine URL (Local or Cloud) |
| `ARCADE_USER_ID`    | No       | 'dev'     | Your Arcade user ID         |

> ⚠️ **Security Note**: Never commit your `.env` file to version control. It contains sensitive API keys that should remain private.

## Development

### Running Locally

1. Start the development server:

```bash
pnpm dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

### Local Toolkit Development

To develop and test your own tools:

1. Follow the [Arcade documentation](https://docs.arcade.dev/home/build-tools/create-a-toolkit) to create your toolkit

2. Start the local engine and actor:

```bash
arcade dev
```

3. Update `ARCADE_ENGINE_URL` in your `.env` to point to your local endpoint

4. Run the development server:

```bash
pnpm dev
```

## Deployment

The application can be deployed to any platform that supports Next.js applications. Follow the standard deployment procedures for your chosen platform.
