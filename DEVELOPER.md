# Developer Guide

This guide contains all the technical information you need to set up, run, and contribute to the Data Chatbot project.

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Database Setup](#database-setup)
- [Backend API](#backend-api)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Development Scripts](#development-scripts)
- [Testing](#testing)
- [Contributing](#contributing)

## Architecture

This project consists of two main components:

- **Frontend**: Next.js 16 application with React Server Components
- **Backend**: FastAPI application providing REST API and streaming endpoints

### Tech Stack

**Frontend:**

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Vercel AI SDK

**Backend:**

- FastAPI
- Python 3.11+
- SQLAlchemy (async)
- PostgreSQL
- Redis (for caching)
- Alembic (migrations)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and **pnpm** 9.12.3+
- **Python** 3.11+ and **uv** (Python package manager)
- **PostgreSQL** 14+ (or access to a PostgreSQL database)
- **Redis** (optional, for caching)
- **Vercel CLI** (optional, for deployment)

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vercel-ai-chatbot
```

### 2. Frontend Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

### 3. Backend Setup

```bash
cd backend

# Install dependencies using uv
uv sync

# Run development server
uv run uvicorn app.main:app --reload --port 8001

# Or run the script: bash run.sh (backend/run.sh)
```

The backend API will be available at [http://localhost:8001](http://localhost:8001)
API documentation (Swagger) at [http://localhost:8001/docs](http://localhost:8001/docs)

## Environment Variables

### Frontend (.env.local)

Create a `.env.local` file in the root directory with the variables from the `.env.example` file.

```bash
# Copy the variables from the .env.example file
cp .env.example .env.local

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
```

### Backend (.env)

Create a `.env` file in the `backend/` directory with the variables from the `backend/.env.example` file.

```bash
# Copy the variables from the backend/.env.example file
cp backend/.env.example backend/.env

# Environment
ENVIRONMENT=development
```

> **⚠️ Important**: Never commit `.env` or `.env.local` files to version control. They contain sensitive secrets.

## Running the Application

### Development Mode

**Terminal 1 - Frontend:**

```bash
pnpm dev
```

**Terminal 2 - Backend:**

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8001
```

### Production Build

**Frontend:**

```bash
pnpm build
pnpm start
```

**Backend:**

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## Database Setup

### Initial Setup

1. Create a PostgreSQL database:

```bash
createdb chatbot
```

2. Run migrations:

```bash
cd backend
uv run alembic upgrade head
```

**Backend (Alembic):**

```bash
cd backend

# Create a new migration
uv run alembic revision --autogenerate -m "description"

# Apply migrations
uv run alembic upgrade head

# Rollback one migration
uv run alembic downgrade -1
```

## Backend API

### API Endpoints

The backend provides the following main endpoints:

- `POST /api/v1/chat` - Create or continue a chat conversation (streaming)
- `GET /api/history` - Get chat history
- `DELETE /api/chat/:id` - Delete a chat
- `POST /api/vote` - Vote on a message
- `POST /api/document` - Create or update documents
- `GET /api/files/:id` - Get file information
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### API Documentation

When the backend is running, visit:

- **Swagger UI**: [http://localhost:8001/docs](http://localhost:8001/docs)
- **ReDoc**: [http://localhost:8001/redoc](http://localhost:8001/redoc)

### Authentication

The API uses JWT tokens for authentication. Include the token in the `Authorization` header:

```
Authorization: Bearer <your-token>
```

## Deployment

### Deployment

The application can be deployed to any platform that supports Next.js and FastAPI.

## Project Structure

```
vercel-ai-chatbot/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (chat)/            # Chat interface
│   └── api/               # API routes
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/v1/        # API endpoints
│   │   ├── ai/            # AI client and tools
│   │   ├── core/          # Core configuration
│   │   ├── db/            # Database queries
│   │   ├── models/        # SQLAlchemy models
│   │   └── utils/         # Utility functions
│   ├── alembic/           # Database migrations
│   └── tests/             # Backend tests
├── components/            # React components
├── lib/                   # Shared utilities
│   ├── ai/               # AI SDK configuration
│   └── db/               # Database client
├── hooks/                 # React hooks
└── tests/                 # E2E tests (Playwright)
```

## Development Scripts

### Frontend Scripts

```bash
# Development
pnpm dev              # Start dev server with Turbo

# Building
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run linter (Ultracite/Biome)
pnpm format           # Format code

# Testing
pnpm test             # Run Playwright E2E tests
```

### Backend Scripts

```bash
cd backend

# Development
uv run uvicorn app.main:app --reload --port 8001

# Database
uv run alembic upgrade head    # Apply migrations
uv run alembic revision --autogenerate -m "message"  # Create migration

# Testing
uv run pytest tests/
```

## Testing

### Frontend E2E Tests

Uses Playwright for end-to-end testing:

```bash
pnpm test
```

Tests are located in `tests/e2e/` and `tests/routes/`.

### Backend Tests

Uses pytest:

```bash
cd backend
uv run pytest tests/
```

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** following the project's code style
4. **Run tests**: Ensure all tests pass
5. **Format code**: Run `pnpm format` (frontend) or `uv run ruff format .` (backend)
6. **Commit your changes**: Use clear, descriptive commit messages
7. **Push to your fork**: `git push origin feature/your-feature-name`
8. **Open a Pull Request**: Open a pull request to the `dev` branch

### Code Style

- **Frontend**: Uses Biome for formatting and linting
- **Backend**: Uses Ruff for formatting and linting
- Follow TypeScript/Python best practices
- Write tests for new features
- Update documentation as needed

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vercel AI SDK](https://ai-sdk.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [SQLAlchemy](https://docs.sqlalchemy.org/)

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` format matches your database setup
- Verify database exists: `psql -l`

### Port Already in Use

- Frontend (3001): Change port with `pnpm dev --port 3001`
- Backend (8001): Change port in uvicorn command

### Environment Variables Not Loading

- Ensure `.env.local` (frontend) and `.env` (backend) files exist
- Restart the development server after changing env vars
- Check file is in the correct directory

### Migration Issues

- Ensure database is up to date: `uv run alembic upgrade head`
- Check migration files are in correct directories
- Verify database schema matches models

---
