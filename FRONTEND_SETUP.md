# Running the Frontend Only

This guide shows you how to run just the Next.js frontend.

## Quick Start

### 1. Install Dependencies

```bash
# Make sure you're in the project root (not the backend directory)
pnpm install
```

### 2. Set Up Environment Variables

The frontend can work in two modes:

#### Option A: Use Next.js API Routes (Current Backend)

The frontend is currently configured to use Next.js API routes as the backend. You'll need:

```bash
# Copy environment variables template (if it exists)
# Or create .env.local with minimal config
```

Required environment variables (check `.env.example` if it exists):
- Database connection (for Next.js API routes)
- Authentication secrets
- AI provider keys

#### Option B: Point to FastAPI Backend

If you want to use the FastAPI backend instead:

Create `.env.local` in the project root:

```env
# Point frontend to FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_FASTAPI_BACKEND=true
```

**Note**: You'll need to update the frontend code to use the FastAPI backend (see migration plan).

### 3. Run the Development Server

```bash
pnpm dev
```

The frontend will be available at:
- **Frontend**: http://localhost:3000

## Current Setup

The frontend is currently configured to use **Next.js API routes** as the backend. This means:

- API calls go to `/api/*` routes in the Next.js app
- The backend code is in `app/*/api/` directories
- Authentication uses NextAuth.js
- Database operations happen in Next.js server components/actions

## Running Frontend with FastAPI Backend

If you want to use the FastAPI backend you created:

1. **Start the FastAPI backend first:**
   ```bash
   cd backend
   uv run uvicorn app.main:app --reload --port 8000
   ```

2. **Update frontend to use FastAPI:**
   - Update API calls in `components/chat.tsx`
   - Update authentication to use JWT instead of NextAuth
   - See `MIGRATION_PLAN.md` for detailed steps

3. **Set environment variables:**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_USE_FASTAPI_BACKEND=true
   ```

4. **Start the frontend:**
   ```bash
   pnpm dev
   ```

## Troubleshooting

### Port Already in Use
```bash
# Use a different port
pnpm dev -- -p 3001
```

### Database Connection Errors
- If using Next.js API routes: Make sure your database is accessible
- If using FastAPI: Make sure the backend is running on port 8000

### Authentication Issues
- Next.js API routes: Uses NextAuth.js (check `app/(auth)/auth.ts`)
- FastAPI: Uses JWT tokens (requires frontend code updates)

## Development Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Format code
pnpm format

# Database migrations (if using Next.js backend)
pnpm db:migrate
```

## What You Need

### For Next.js API Routes (Current):
- PostgreSQL database
- Environment variables for database, auth, AI providers
- All configured in `.env.local`

### For FastAPI Backend:
- FastAPI backend running on port 8000
- Frontend code updated to call FastAPI endpoints
- CORS configured in FastAPI to allow `http://localhost:3000`

## Quick Reference

| Task | Command |
|------|---------|
| Install dependencies | `pnpm install` |
| Run dev server | `pnpm dev` |
| Build | `pnpm build` |
| Start production | `pnpm start` |
| Lint | `pnpm lint` |
| Format | `pnpm format` |

The frontend will run on **http://localhost:3000** by default.
