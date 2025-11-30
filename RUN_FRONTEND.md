# Running the Frontend

## Quick Start

### 1. Install Dependencies

```bash
# Make sure you're in the project root (not backend/)
pnpm install
```

### 2. Run the Development Server

```bash
pnpm dev
```

The frontend will start at **http://localhost:3000**

## That's It!

The frontend is currently configured to use **Next.js API routes** as the backend (integrated in the same Next.js app). This means:

- ✅ No separate backend needed
- ✅ API routes are in `app/*/api/` directories
- ✅ Everything runs together

## Environment Variables

If you need to configure environment variables, create a `.env.local` file in the project root. Check the README or look for `.env.example` for required variables.

Common variables you might need:
- Database connection (if using database features)
- AI provider API keys
- Authentication secrets

## Commands

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)

# Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Check code
pnpm format           # Format code

# Database (if needed)
pnpm db:migrate       # Run database migrations
```

## Troubleshooting

**Port 3000 already in use?**
```bash
pnpm dev -- -p 3001
```

**Missing dependencies?**
```bash
pnpm install
```

**Need to use FastAPI backend instead?**
- See `FRONTEND_SETUP.md` for instructions
- You'll need to update the frontend code to point to the FastAPI backend

## Current Architecture

The frontend uses **Next.js App Router** with:
- **Frontend**: React components in `components/` and `app/`
- **Backend**: Next.js API routes in `app/*/api/`
- **Database**: PostgreSQL (via Drizzle ORM)
- **Auth**: NextAuth.js

Everything runs together when you do `pnpm dev`!

