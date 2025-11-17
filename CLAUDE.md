# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Splx Studio** (formerly Claudia) is a multi-tenant SaaS platform that provides AI-enhanced workflows, data management, and team collaboration tools. Built with SvelteKit and Supabase, it offers visual workflow builders, role-based permissions, and AI-assisted features.

### Core Concept

- **Multi-tenant SaaS**: Workspaces with user management and role-based access control
- **Visual workflows**: Drag-and-drop workflow editor with step configuration
- **AI-enhanced**: AI chat, JSON generation, and intelligent data processing
- **Database-centric**: Dynamic table management with audit logging and history tracking

## Development Commands

```bash
# Install dependencies (uses pnpm)
npm install

# Development server (runs on localhost:5173)
npm run dev

# Build for production
npm run build

# Database operations (Supabase migrations)
pnpm db:migrate     # Apply pending Supabase migrations (supabase migration up)
pnpm db:reset       # Reset database and apply all migrations (supabase db reset)
pnpm db:generate    # Generate Drizzle migrations from schema (for reference only)
pnpm db:push        # Push schema changes directly via Drizzle (for development only)
pnpm db:pull        # Pull schema from database via Drizzle
pnpm db:studio      # Open Drizzle Studio GUI
pnpm db:check       # Check migration issues
pnpm db:up          # Apply pending migrations via Drizzle (legacy)
pnpm provision:workspace  # Provision or update a workspace (scripts/provision-workspace.ts)
```

## Architecture Overview

### Authentication & Multi-tenancy

**Supabase Auth** handles user authentication with custom session management:

- `lib/supabase/server.ts` - Creates SSR Supabase client helpers
- `proxy.ts` - Next.js middleware bridging Supabase sessions with onboarding checks
- `middleware.ts` - Injects workspace headers for every request
- `lib/server/tenant/context.ts` - Resolves tenant context, creates local workspaces, syncs memberships
- `lib/server/tenant/resource-store.ts` - Factory that returns the correct resource adapter per workspace

**Workspaces & Teams**:
- Multi-tenant via `workspaces` table - each workspace has optional `owner_user_id`
- `workspace_users` - Junction table for workspace membership with roles
- `workspace_invites` - Secure invitations with role grants
- `workspace_apps` - External resource connections (postgres/neon/planetscale/zapier)

### Tenant Data Access

- `lib/server/tenant/resource-store.ts` - Creates adapters per workspace connection (`local`, `postgres`, `zapier`)
- `lib/server/tenant/adapters/postgres.ts` - Drizzle/Postgres adapter using configurable credential refs
- `lib/server/tenant/adapters/zapier.ts` - HTTP webhook adapter for Zapier integrations
- `lib/db/queries.ts` - Uses `withTenantDb()` helper so every query executes within the current workspace context
- `middleware.ts` + `resolveTenantContext()` ensure requests carry `x-workspace-id` headers and memberships are synced

### Role-Based Access Control (RBAC)

Centralized permission system in `src/lib/server/permissions.ts`:

```typescript
import { hasPermission, requirePermission, getUserRoles } from '$lib/server/permissions';

// Check permission (returns boolean)
const canEdit = await hasPermission(supabase, userId, 'workflows.edit');

// Require permission (throws 403 if denied)
await requirePermission(supabase, userId, 'data.delete');

// Get user roles
const roles = await getUserRoles(supabase, userId);
```

**Permission Format**:
- Wildcards supported: `*` (all), `data.*` (all data operations)
- Resource.action pattern: `workflows.edit`, `tables.view`, `users.manage`
- Checked via `role_permissions` table joined with `user_roles`

**Common Permissions**:
- `workflows.*` - All workflow operations
- `tables.view`, `tables.edit` - Table access
- `data.*` - Data CRUD operations
- `organization.*` - Organization settings
- `users.manage` - User management

### Database Schema

**Core Tables** (`src/lib/server/db/schema.ts`):

- `users` - User profiles (firstname, lastname, avatar_url)
- `sessions` - Auth sessions (managed by Supabase)
- `workspaces` - Multi-tenant workspaces
- `workspace_users` - Workspace membership with roles
- `workspace_invites` - Invitation tokens + accepted metadata
- `workspace_apps` - External connection metadata per workspace

**Application Tables**:

- `chats`, `messages` - AI chat conversations
- `ai_usage` - AI usage tracking for cost management
- `vhTables` (`tables`) - Dynamic table metadata with JSONB schema definitions
- `vhAuditLog` (`audit_log`) - Audit trail for all record changes
- `workflows`, `workflow_steps` - Visual workflow definitions
- `functions` - Workflow function definitions with input/output schemas
- `views` - Custom view layouts with JSONB blocks, settings, and layout configuration
- All tenant tables include a `workspace_id` column and enforce Supabase RLS policies via helper functions (`user_is_workspace_member`, `user_has_workspace_role`)

**Organization Settings**:
- `organization_settings` - Singleton table (ID: `00000000-0000-0000-0000-000000000001`)
- Contains branding, AI context, and global configuration
- Loaded in `src/routes/app/+layout.server.ts` for all app routes

### Visual Workflow System

**Architecture**:
- Uses `@xyflow/svelte` for visual workflow editor
- Workflows consist of steps connected in a directed graph
- Each step executes a Postgres function with mapped parameters
- Supports conditional branching and data transformation

**Key Files**:
- `src/routes/app/workflows/[workflow]/edit/+page.svelte` - Visual editor
- `src/lib/components/workflow/step-config-modal.svelte` - Step configuration
- `src/lib/components/workflow/parameter-input.svelte` - Dynamic parameter inputs
- `supabase/migrations/20250101000003_workflows_and_functions.sql` - Workflow functions
- `supabase/migrations/20250101000013_workflow_function_definitions.sql` - Function metadata

**Workflow Functions** (see `docs/WORKFLOW_FUNCTIONS.md`):
- CRUD operations: `wf_create_record`, `wf_read_record`, `wf_update_record`, `wf_delete_record`
- Utilities: `wf_evaluate_condition`, `wf_transform_data`, `wf_validate_data`
- Webhooks: `wf_trigger_webhook`
- All functions are Postgres functions with JSONB input/output

**Dynamic Parameters**:
- `table_name` parameters use dropdowns populated from `get_user_tables()`
- Column parameters generated dynamically based on selected table schema
- Supports parameter mapping from previous step outputs

### Views System

**Architecture**:
- Configurable UI layout builder for creating custom views with reusable blocks
- Views are stored in `views` table with JSONB schema for `blocks`, `settings`, and `layout`
- Supports URL parameter resolution for dynamic filtering and data display
- Four block types: List, Record, Report, and Trigger

**Block Types**:
- **List Block** - Displays paginated table data with filtering (`ListBlock.svelte`)
- **Record Block** - Shows single record in read/edit/create modes (`RecordBlock.svelte`)
- **Report Block** - Displays charts from saved SQL queries (`ReportBlock.svelte`) [planned]
- **Trigger Block** - Action buttons with confirmation (`TriggerBlock.svelte`)

**Key Features**:
- **URL Parameters**: Define required params in `settings.urlParams`, reference via `url.paramName`
- **Dynamic Filtering**: Filter operators (equals, contains, greater_than, etc.) with URL param support
- **Templates**: Pre-built view patterns (Detail, List, Dashboard, Form)
- **Visual Builder**: Drag-and-drop interface at `/app/views/[viewId]?viewMode=edit`

**Key Files**:
- `src/lib/components/views/builder/ViewBuilder.svelte` - Main editor component
- `src/lib/components/views/builder/BlockConfigPanel.svelte` - Block configuration modal
- `src/lib/components/views/builder/DataSourceConfig.svelte` - Data source setup
- `src/lib/components/views/builder/DisplayConfig.svelte` - Display options
- `src/lib/components/views/builder/FilterConfig.svelte` - Filter conditions UI
- `src/lib/utils/view-templates.ts` - Predefined templates
- See `docs/VIEWS_SYSTEM.md` for comprehensive documentation

**Permissions**:
- `views.view` - Required to view any view
- `views.edit` - Required to create/edit views

### AI Integration

**Model Configuration** (`src/lib/server/ai/models.ts`):

Uses Vercel AI SDK with custom provider wrapping OpenAI models:

- `title-model` - Fast title generation (gpt-5-nano, minimal reasoning)
- `chat-model` - Standard chat (gpt-5-mini, medium reasoning)
- `chat-model-reasoning` - Chat with detailed reasoning summary
- `code-generation`, `planning`, `migration-generation`, `schema-analysis` - Specialized models
- All models use OpenAI's reasoning effort and summary features

**AI Features**:
- Chat interface with streaming responses (`src/routes/(chat)/api/chat/+server.ts`)
- JSON generation endpoint (`src/routes/api/ai/generate-json/+server.ts`)
- Automatic chat title generation
- AI usage tracking in `ai_usage` table via `logAIUsage()` in `src/lib/server/ai/usage.ts`

**Client-Side AI** (`src/lib/ai/models.ts`):
- Model selection via cookie (`selected-model`)
- Default: `chat-model`
- Available: `chat-model`, `chat-model-reasoning`

### Error Handling Pattern

Uses **neverthrow** for type-safe error handling:

```typescript
import { ResultAsync, safeTry, ok, err, fromPromise } from 'neverthrow';

function getUser(id: string): ResultAsync<User, DbError> {
  return safeTry(async function* () {
    const user = yield* fromPromise(
      db.query.user.findFirst({ where: eq(user.id, id) }),
      (e) => new DbInternalError({ cause: e })
    );

    if (!user) {
      return err(new DbNotFoundError());
    }

    return ok(user);
  });
}
```

All database operations return `ResultAsync<T, DbError>`. Custom error types in `src/lib/errors/`.

### Route Structure

**Public Routes**:
- `/signin`, `/signup` - Authentication
- `/` - Landing page

**App Routes** (`/app/*`):
All app routes require authentication and load permissions via `+layout.server.ts`:

- `/app` - Dashboard
- `/app/workflows` - Workflow list
- `/app/workflows/[workflow]` - View workflow
- `/app/workflows/[workflow]/edit` - Visual workflow editor
- `/app/views` - Views list
- `/app/views/[viewId]` - View display page (supports `?viewMode=edit` for builder)
- `/app/tables` - Table browser
- `/app/tables/[table]` - View table data
- `/app/tables/[table]/edit` - Edit table schema
- `/app/tables/[table]/[record]` - View record with audit timeline
- `/app/users` - User management
- `/app/teams` - Team management
- `/app/settings/organization` - Organization settings

**API Routes** (`/api/*`):
- `/api/chat` - AI chat streaming
- `/api/ai/generate-json` - AI JSON generation
- `/api/workflows/*` - Workflow CRUD
- `/api/functions` - Workflow functions
- `/api/views` - View CRUD (list, create)
- `/api/views/[id]` - Get view
- `/api/views/[id]/save` - Save view configuration
- `/api/supabase/table` - Fetch table data with filtering
- `/api/supabase/record` - Fetch single record
- `/api/supabase/*` - Supabase management (projects, tables, records)
- `/api/users/*` - User management
- `/api/teams/*` - Team management

### UI Component System

- **shadcn-svelte** component library (`src/lib/components/ui/`)
- **Bits UI** primitives for accessibility
- **Tailwind CSS v4** (via `@tailwindcss/vite` plugin in `vite.config.ts`)
- **mode-watcher** for theme management
- **jsrepo** for component management (see `jsrepo.json`)
- **@ieedan/shadcn-svelte-extras** - Additional components (check before creating new ones)

**Code Components**:
- `src/lib/components/ui/code/` - Code editor/viewer
- `src/lib/components/ui/copy-button/` - Copy to clipboard
- Uses **CodeMirror** for JSON editing with syntax highlighting

### Monitoring & Error Tracking

**Sentry Integration**:
- Configured in `vite.config.ts` and `src/hooks.server.ts`
- Project: `claudia` under org `deagil-apps`
- Source maps uploaded automatically on build
- Error handling via `Sentry.handleErrorWithSentry()`

## Environment Setup

Create `.env.local`:

```
# Supabase (required)
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
PRIVATE_SUPABASE_SERVICE_ROLE=your_service_role_key

# AI Providers (required for AI features)
PRIVATE_OPENAI_KEY=your_openai_key

# Stripe (optional, for billing)
PRIVATE_STRIPE_SECRET_KEY=your_stripe_key

# Sentry (optional, for error tracking)
SENTRY_AUTH_TOKEN=your_sentry_token
```

## Key Patterns and Conventions

### Server-Side Data Loading

Load functions use `locals.supabase` (respects RLS) and `locals.safeGetSession()`:

```typescript
export async function load({ locals }) {
  const { user } = await locals.safeGetSession();
  if (!user) {
    return redirect(303, '/signin');
  }

  // Check permissions
  await requirePermission(locals.supabase, user.id, 'workflows.view');

  const { data } = await locals.supabase
    .from('workflows')
    .select('*')
    .eq('workspace_id', user.workspace_id);

  return { workflows: data };
}
```

### Service Role Usage

Use `locals.supabaseServiceRole` **only** when you need to bypass RLS (e.g., admin operations):

```typescript
// Service role bypasses RLS - use carefully!
const { data } = await locals.supabaseServiceRole
  .from('users')
  .select('*');
```

### Svelte 5 Runes

This project uses **Svelte 5** with runes syntax:

```typescript
let count = $state(0);
let doubled = $derived(count * 2);

$effect(() => {
  console.log('Count changed:', count);
});
```

### Form Handling

Uses **sveltekit-superforms** with **Zod** validation:

```typescript
import { superForm } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1)
});

const form = superForm(data.form, {
  validators: zod(schema)
});
```

### Dynamic Table Management

Tables are defined in `vhTables` with JSONB schemas:

```typescript
// Get user tables
const { data: tables } = await supabase.rpc('get_user_tables');

// Get table columns
const { data: columns } = await supabase.rpc('get_table_columns', {
  p_table_name: 'my_table'
});
```

### Audit Logging

Audit logs are automatically captured via database triggers when history is enabled:

```typescript
// Enable audit history for a table
await supabase.rpc('enable_history_for_table', {
  p_table_name: 'my_table'
});

// Query audit log
const { data: logs } = await supabase
  .from('audit_log')
  .select('*')
  .eq('record_table', 'my_table')
  .eq('record_id', recordId)
  .order('created_at', { ascending: false });
```

## Component Guidelines

### Before Creating New Components

Check `@ieedan/shadcn-svelte-extras` with jsrepo first:

```bash
# Search for existing components
npx jsrepo add [component-name]
```

See `.cursor/rules/shadcn-svelte-extras.mdc` for pinned versions.

### TypeScript Types

App types are extended in `src/app.d.ts` to include:
- `locals.supabase` - Supabase client
- `locals.supabaseServiceRole` - Service role client
- `locals.stripe` - Stripe client
- `locals.safeGetSession()` - Session validation function

## Development Notes

- **Package Manager**: Uses pnpm (version `10.11.1`)
- **Framework**: Next.js 16 App Router with server components
- **Type Safety**: TypeScript 5.9 + Biome linting (`pnpm lint`)
- **Database Migrations**: All migrations are consolidated in Supabase SQL files (`supabase/migrations/`). The initial schema (`20251111000000_initial_schema.sql`) creates all base tables, followed by workspace RBAC (`20251111000100_workspace_rbac.sql`), workspace_id columns (`20251111000200_add_workspace_ids.sql`), and RLS policies (`20251111000300_workspace_rls.sql`). Drizzle migrations in `lib/db/migrations/` are kept for reference but are no longer executed.
- **Provisioning**: Run `pnpm provision:workspace` to bootstrap a workspace, owner membership, and default connection
- **Debugging**: Console logs available throughout; check browser console and server logs
- **Supabase Functions**: Workflow functions remain Postgres functions prefixed with `wf_`
