# LostMind AI Chatbot - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- pnpm package manager
- Git
- A code editor (VS Code recommended)

## Initial Setup

### 1. Environment Configuration

```bash
# Copy environment file
cp .env.example .env.local

# Edit environment variables
# Add your API keys and database credentials
```

### 2. Install Dependencies

```bash
# Install all dependencies
pnpm install

# Update to latest AI SDK version (important!)
pnpm update ai@4.3.15 @ai-sdk/google@1.2.17 @ai-sdk/react@1.2.12
```

### 3. Database Setup

```bash
# Run database migrations
pnpm run db:migrate

# Optional: Open database studio
pnpm run db:studio
```

### 4. Start Development Server

```bash
# Start the development server
pnpm run dev
```

The application should now be running at http://localhost:3000

## Migration Progress

### What's Complete
- ✅ Latest Vercel AI template cloned
- ✅ Task management system created
- ✅ Migration plan documented
- ✅ Brand guidelines established

### Next Steps
1. Complete Phase 1: Component Migration
2. Configure Gemini models
3. Implement brand styling
4. Deploy to production

## Task Execution Workflow

### Check Current Task
```bash
# View task tracker
cat Tasks/task-tracker.md

# View current task details
cd Tasks/phase-1
cat task-1-1-logo-component.md
```

### Execute Tasks
1. Follow task instructions in markdown files
2. Update progress in task-tracker.md
3. Move completed tasks to completed folder
4. Test thoroughly before proceeding

## Important Files

```
📁 Project Root/
├── PROJECT_MEMORY.md      # Complete project context
├── docs/
│   ├── MIGRATION_PLAN.md  # Detailed migration strategy
│   ├── BRAND_GUIDELINES.md # Styling and design
│   └── QUICK_START.md     # This file
├── Tasks/
│   ├── README.md          # Task management guide
│   ├── task-tracker.md    # Progress tracking
│   └── phase-*/           # Task directories
└── .env.example           # Environment template
```

## Development Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run linting
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code

# Database
pnpm db:generate      # Generate migrations
pnmp db:migrate      # Run migrations
pnpm db:studio        # Open database UI

# Testing
pnpm test             # Run tests
```

## Key Environment Variables

```env
# Required
POSTGRES_URL=your_database_url
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
AUTH_SECRET=your_auth_secret

# Optional but Recommended
REDIS_URL=your_redis_url
NEXT_PUBLIC_APP_URL=https://chat.lostmindai.com
NEXT_PUBLIC_BRAND_NAME="LostMind AI"
```

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure AI SDK is version 4.3.13+
2. **Database Connection**: Verify Postgres URL format
3. **API Keys**: Check all required keys in .env.local
4. **Port Conflicts**: Change port with `-p 3001`

### Getting Help

1. Check PROJECT_MEMORY.md for context
2. Review docs/MIGRATION_PLAN.md
3. Examine task-specific markdown files
4. Look at original project for reference

## Next Phases

### Week 1: Foundation
- Complete component migration
- Set up environment
- Verify basic functionality

### Week 2: Core Features
- Implement model integration
- Apply branding updates
- Test all functionality

### Week 3-4: Advanced Features
- Add splash screen
- Implement advanced animations
- Configure MCP tools
- Optimize performance

## Resources

- [AI SDK Documentation](https://ai-sdk.dev)
- [Next.js 15 Docs](https://nextjs.org)
- [Tailwind CSS](https://tailwindcss.com)
- [Vercel Deployment](https://vercel.com/docs)

## Support

For issues:
1. Check task-tracker.md for known issues
2. Review error logs
3. Consult migration documentation
4. Refer to original project

---

**Happy coding!** 🚀  
Last updated: May 12, 2025
