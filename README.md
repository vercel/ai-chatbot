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

### Quick Deploy
- Deploy to Vercel or your preferred platform
- Set all required environment variables in the dashboard

### CI/CD Pipeline
This project includes a comprehensive CI/CD pipeline with automated testing, security scanning, and multi-environment deployments.

**Features:**
- ✅ Automated quality checks and testing
- ✅ Security vulnerability scanning
- ✅ Multi-environment deployments (Dev, Staging, Production)
- ✅ Performance monitoring with Lighthouse
- ✅ Automated dependency updates
- ✅ Docker support for containerized deployments

**Quick Setup:**
```bash
# Run the automated setup script
./scripts/setup-cicd.sh
```

**Documentation:**
- 📖 [Complete CI/CD Guide](./docs/CI-CD-PIPELINE.md)
- 🚀 [Quick Reference](./docs/CI-CD-QUICK-REFERENCE.md)
- 📋 [Setup Instructions](./CI-CD-SETUP.md)

**Pipeline Status:**
![CI/CD Pipeline](https://github.com/vercel/ai-chatbot/actions/workflows/ci-cd-pipeline.yml/badge.svg)

## Optimization
- Uses dynamic imports and cache components for performance
- See `next.config.js` for advanced settings

## Contributing
- Run `pnpm lint` and `pnpm format` before PRs
- Add tests for new features

---

For help, contact the TiQology team.
