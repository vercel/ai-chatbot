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

## Table of Contents
- [Features](#features)
- [Model Providers](#model-providers)
- [Deploy Your Own](#deploy-your-own)
- [Running locally](#running-locally)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Features

- **[Next.js](https://nextjs.org) App Router:** We use Next.js, a popular tool for building websites. Its 'App Router' is like a smart map for the app, making it easy to get around and ensuring pages load quickly. It also uses the latest web technologies to make the app speedy and responsive.
- **[AI SDK](https://sdk.vercel.ai/docs):** Think of the AI SDK as a special toolbox that helps our chatbot understand what you type and how to reply. It lets us connect to various 'AI brains' (called LLMs) that are good at writing, understanding, and even using other tools. It also gives us pre-built parts to create the chat windows you see.
- **[shadcn/ui](https://ui.shadcn.com):** This is our design toolkit. It gives us ready-made visual parts for the app, like buttons and menus. We use Tailwind CSS to easily style these parts and make them look great. It also uses something called Radix UI to make sure all elements are easy to use for everyone, including people with disabilities.
- **Data Persistence:** This means the app can save your information.
    - **[Neon Serverless Postgres](https://vercel.com/marketplace/neon):** This is a smart database where we safely keep your past conversations and account information.
    - **[Vercel Blob](https://vercel.com/storage/blob):** This is where we efficiently store any files you might upload or share in the chat, like images or documents.
- **[Auth.js](https://authjs.dev):** This is what takes care of letting you sign in and keeps your account details safe and sound.

## Model Providers

This template comes with a specific AI "brain" (called a chat model from xAI) ready to go. Think of a chat model, or LLM (Large Language Model) provider, as the source of the AI's conversational abilities. The great thing about the AI SDK we use is that it's super easy to switch to a different "brain" if you want to. You can choose from many providers like OpenAI, Anthropic, Cohere, and others with just a small change in the code. This gives you the flexibility to use the AI model that best fits your needs!

## Deploy Your Own

You can deploy your own version of the Next.js AI Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot&env=AUTH_SECRET&envDescription=Learn+more+about+how+to+get+the+API+Keys+for+the+application&envLink=https%3A%2F%2Fgithub.com%2Fvercel%2Fai-chatbot%2Fblob%2Fmain%2F.env.example&demo-title=AI+Chatbot&demo-description=An+Open-Source+AI+Chatbot+Template+Built+With+Next.js+and+the+AI+SDK+by+Vercel.&demo-url=https%3A%2F%2Fchat.vercel.ai&products=%5B%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22ai%22%2C%22productSlug%22%3A%22grok%22%2C%22integrationSlug%22%3A%22xai%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22neon%22%2C%22integrationSlug%22%3A%22neon%22%7D%2C%7B%22type%22%3A%22integration%22%2C%22protocol%22%3A%22storage%22%2C%22productSlug%22%3A%22upstash-kv%22%2C%22integrationSlug%22%3A%22upstash%22%7D%2C%7B%22type%22%3A%22blob%22%7D%5D)

## Running locally

This section describes setting up with Vercel CLI. For a more general local setup, please see the [Getting Started](#getting-started) section below.

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

## Getting Started

Welcome! This guide will help you get a copy of this chatbot running on your own computer. We'll walk through each step.

**1. What You'll Need (Prerequisites):**

*   **Node.js:** This is a program that lets you run JavaScript code outside of a web browser. You'll need it to build and run this project. If you don't have it, you can download it from [nodejs.org](https://nodejs.org/). We recommend the LTS (Long Term Support) version.
*   **pnpm:** This is a tool that helps manage the project's code libraries (called packages). Once you have Node.js, you can install pnpm by opening your computer's command line (Terminal on Mac/Linux, Command Prompt or PowerShell on Windows) and typing:
    ```bash
    npm install -g pnpm
    ```

**2. Get the Code (Clone the Repository):**

*   You need to download the project files. If you have Git installed, you can do this by opening your command line and running:
    ```bash
    git clone https://github.com/vercel/ai-chatbot.git
    ```
*   This will create a folder named `ai-chatbot` with all the project code. Go into this folder:
    ```bash
    cd ai-chatbot
    ```
*   If you don't have Git, you can download the code as a ZIP file from the main project page on GitHub (usually a green "Code" button).

**3. Set Up Your Environment (Environment Variables):**

*   This project needs some secret keys and settings to work, like API keys for the AI model. These are called environment variables.
*   In the project folder, you'll find a file named `.env.example`. This is a template.
*   **Create a copy** of this file and name it `.env` (just `.env`, with no other words).
*   Open the `.env` file with a text editor. You'll see lines like `SOME_VARIABLE=your_value_here`.
*   You'll need to fill in the actual values for these variables. For example, to connect to an AI provider, you'll need an API key from them. Look for comments inside the `.env.example` file; these will guide you on what specific values are needed for each variable.
*   **Important:** Keep your `.env` file secret! Do not share it or upload it online (e.g., to GitHub). This file contains sensitive information. The project is already set up to ignore it if you use Git.

**4. Install Project Dependencies:**

*   Now, you need to download all the code libraries the project depends on. Open your command line in the `ai-chatbot` folder and run:
    ```bash
    pnpm install
    ```
    This might take a few minutes.

**5. Run the Chatbot:**

*   Once everything is installed, you can start the chatbot on your computer:
    ```bash
    pnpm dev
    ```
*   This will start a local web server. Open your web browser and go to `http://localhost:3000`. You should see the chatbot running!

That's it! You've got the chatbot running locally. Feel free to explore the code and make changes.

## Project Structure

Understanding how a project is organized can make it much easier to explore and modify. Here's a look at the main folders in this chatbot project:

*   `app/`: This is a special Next.js folder. It's where you'll find the code that defines the different pages of the chatbot (like the main chat page) and the user interface parts that are specific to those pages. Next.js uses the structure inside `app/` to figure out the website's addresses (URLs).
*   `components/`: This folder holds reusable building blocks for the user interface. Think of things like buttons, menus, or chat bubbles that might be used in several places. Keeping them here makes it easy to manage and update them.
*   `lib/`: "Lib" is short for "library." This folder contains various helper functions and core logic for the chatbot. You might find code here for connecting to AI services, managing chat history, interacting with the database, or other utility functions that support the app's features.
*   `public/`: This folder is for all the files that are publicly accessible as is, without needing any special processing. This usually includes things like images (logos, icons), fonts, or other static files that your website needs.
*   `tests/`: As the name suggests, this folder contains tests for the project. Tests are important because they help ensure the code works correctly and prevent bugs when changes are made. You might find different kinds of tests here, like unit tests (testing small pieces of code) or integration tests (testing how different parts work together).

This overview provides a good starting point for navigating the codebase.

## Contributing

We love to see community contributions! Whether you've found a bug, have an idea for a new feature, or want to help improve the code, your input is valuable. Here's how you can contribute:

**Found a Bug?**

*   If you've encountered a problem with the chatbot, please let us know by opening an issue on our [GitHub Issues page](https://github.com/vercel/ai-chatbot/issues).
*   When reporting a bug, try to include as much detail as possible:
    *   Steps to reproduce the bug.
    *   What you expected to happen.
    *   What actually happened (including any error messages).
    *   Your browser and operating system.
    *   Screenshots can also be very helpful!

**Have a Suggestion or Enhancement Idea?**

*   We're always looking for ways to make the chatbot better! If you have an idea for an enhancement or a new feature, please open an issue on our [GitHub Issues page](https://github.com/vercel/ai-chatbot/issues).
*   Describe your suggestion clearly and explain why you think it would be a good addition.

**Want to Contribute Code? (Pull Requests)**

*   If you'd like to contribute code directly, here's the general process:
    1.  **Fork the repository:** Create your own copy of the project on GitHub.
    2.  **Create a new branch:** In your forked repository, create a new branch for your changes (e.g., `feature/my-new-feature` or `fix/bug-description`).
    3.  **Make your changes:** Write your code and make sure to test it.
    4.  **Commit your changes:** Use clear and descriptive commit messages.
    5.  **Push to your branch:** Push your changes to your forked repository.
    6.  **Open a Pull Request (PR):** Go to the original `vercel/ai-chatbot` repository on GitHub and open a pull request from your branch. Provide a clear description of your changes in the PR.

We appreciate your help in making this project better for everyone!
