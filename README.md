# LostMind AI Chatbot

<div align="center">
  <img src="public/lostmind-logo.png" alt="LostMind AI" width="100" height="100">
  <h1>LostMind AI</h1>
  <p>Advanced AI Chatbot with Multiple Models - Built on the latest Vercel AI template</p>
  
  <p>
    <a href="#getting-started"><strong>Getting Started</strong></a> ·
    <a href="#features"><strong>Features</strong></a> ·
    <a href="#migration-status"><strong>Migration Status</strong></a> ·
    <a href="#documentation"><strong>Documentation</strong></a>
  </p>
</div>

## Overview

LostMind AI is an advanced chatbot built on the latest Vercel AI template (v4.3.13), featuring:
- 5 AI models including Gemini 2.5 Pro and Flash
- Custom neural network branding
- Resumable streams and advanced features
- Beautiful, responsive interface

## Getting Started

### Quick Setup

```bash
# Clone and install
cd /path/to/project
cp .env.example .env.local
pnpm install

# Start development
pnpm dev
```

🚀 **New to this project?** Check out the [Quick Start Guide](docs/QUICK_START.md)

## Features

### AI Models
- **LostMind Lite** - GPT-4o-mini for fast responses
- **LostMind Pro** - GPT-4o for complex tasks
- **LostMind Quantum** - Gemini 2.5 Pro with reasoning
- **LostMind Vision Pro** - Gemini 2.5 Pro with vision
- **LostMind Flash** - Gemini 2.5 Flash for speed

### Technical Features
- ✨ Resumable streams with Redis
- 👥 User entitlements and rate limiting
- 🔧 MCP tool integration
- 🎨 Custom neural network branding
- 📱 Fully responsive design
- 🌓 Dark/light theme support

## Migration Status

This project is currently migrating from the original implementation to the latest Vercel AI template.

### Completed
- ✅ Latest template setup
- ✅ Task management system
- ✅ Migration planning
- ✅ Brand guidelines

### In Progress
- 🔄 Component migration (Phase 1)
- 🔄 Model integration (Phase 2)
- 🔄 Advanced features (Phase 3)

### Track Progress
Check [task-tracker.md](Tasks/task-tracker.md) for current status

## Documentation

### Quick Links
- 📘 [Quick Start Guide](docs/QUICK_START.md)
- 📋 [Migration Plan](docs/MIGRATION_PLAN.md)
- 🎨 [Brand Guidelines](docs/BRAND_GUIDELINES.md)
- 📝 [Project Memory](PROJECT_MEMORY.md)

### Task Management
- 📁 [Task System Overview](Tasks/README.md)
- 📊 [Progress Tracker](Tasks/task-tracker.md)

## Tech Stack

- **Frontend**: Next.js 15, React 19 RC, Tailwind CSS
- **AI**: Vercel AI SDK 4.3.13, OpenAI, Google Gemini
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Auth**: NextAuth v5
- **Storage**: Vercel Blob
- **Deployment**: Vercel

## Development

### Key Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production

# Database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Database UI

# Code Quality
pnpm lint             # Check code
pnpm lint:fix         # Fix issues
```

### Environment Variables

```env
# Required
POSTGRES_URL=your_database_url
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
AUTH_SECRET=your_secret

# Optional
REDIS_URL=redis://...
NEXT_PUBLIC_APP_URL=https://chat.lostmindai.com
```

## Project Structure

```
lostmind-ai-chatbot/
├── app/                 # Next.js app router
├── components/          # React components
├── lib/                 # Utilities and configurations
├── docs/                # Documentation
├── Tasks/               # Task management
│   ├── phase-1/         # Component migration
│   ├── phase-2/         # Model integration
│   └── phase-3/         # Advanced features
└── public/              # Static assets
```

## Contributing

### Workflow
1. Check [task-tracker.md](Tasks/task-tracker.md) for current task
2. Follow task instructions in phase directories
3. Update progress and complete tasks
4. Move finished tasks to `/completed` folder

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- Responsive design
- Accessibility compliant

## Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel deploy
```

### Environment Setup
1. Add all required environment variables
2. Connect to Neon database
3. Configure Redis for resumable streams
4. Set up domain: chat.lostmindai.com

## Roadmap

### Phase 1: Foundation (Week 1-2)
- [x] Project setup
- [x] Documentation
- [ ] Component migration
- [ ] Basic functionality

### Phase 2: Core Features (Week 3)
- [ ] Model integration
- [ ] Branding application
- [ ] Feature implementation

### Phase 3: Advanced (Week 4-6)
- [ ] Advanced animations
- [ ] MCP integration
- [ ] Performance optimization

## Resources

- [AI SDK Docs](https://ai-sdk.dev)
- [Next.js Guide](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel Docs](https://vercel.com/docs)

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

<div align="center">
  <strong>LostMind AI</strong> | Built with ❤️ using the latest AI technologies
</div>
