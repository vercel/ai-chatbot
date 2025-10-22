# ZTE NOC AI Chatbot

## Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm

### Installation & Run

```bash
# Install pnpm globally (if not installed)
npm install -g pnpm

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Environment Setup

Create a `.env.local` file with required environment variables:

```env
# Database
DATABASE_URL="your_database_url"

# Auth
AUTH_SECRET="your_auth_secret"
```

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linter
pnpm format       # Format code
```

## Tech Stack

- **Next.js 15** - React framework
- **AI SDK** - AI model integration
- **PostgreSQL** - Database
- **Auth.js** - Authentication
- **Tailwind CSS** - Styling