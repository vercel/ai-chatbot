# TiQology Nexus

## Overview
TiQology Nexus is an elite, high-performance AI platform for agent swarms, neural memory, vision, and collaborative intelligence.

## Requirements
- Node.js 18.18.2 (see `.nvmrc`)
- pnpm (recommended)
- Supabase/Postgres
- OpenAI API key

## Setup
```bash
# Install dependencies
pnpm install

# Copy and edit environment variables
cp .env.example .env.local
# (edit .env.local with your keys)

# Build (with increased memory)
NODE_OPTIONS="--max-old-space-size=6144" pnpm run build

# Start
pnpm start
```

## Deployment
- Deploy to Vercel or your preferred platform
- Set all required environment variables in the dashboard

## Optimization
- Uses dynamic imports and cache components for performance
- See `next.config.js` for advanced settings

## Contributing
- Run `pnpm lint` and `pnpm format` before PRs
- Add tests for new features

---

For help, contact the TiQology team.
