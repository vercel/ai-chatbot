# Neon → Supabase Migration Playbook

This guide explains how to migrate existing production data from the legacy Neon database (Drizzle schema) into the new Supabase Postgres database that powers Prisma + NextAuth.

## Prerequisites

- Node.js 20+
- Access credentials for both databases:
  - `NEON_DATABASE_URL`
  - `SUPABASE_DATABASE_URL`
- Supabase database provisioned with the Prisma schema (run `pnpm prisma:deploy`).
- Optional: backup snapshots for both databases.

## 1. Dry run & verification

```bash
NEON_DATABASE_URL="postgresql://..." \
SUPABASE_DATABASE_URL="postgresql://..." \
  pnpm ts-node --swc scripts/migrate-neon-to-supabase/index.ts --dry-run
```

The script prints row counts discovered in Neon without writing to Supabase. Confirm the numbers align with expectations.

## 2. Run the migration

```bash
NEON_DATABASE_URL="postgresql://..." \
SUPABASE_DATABASE_URL="postgresql://..." \
  pnpm ts-node --swc scripts/migrate-neon-to-supabase/index.ts
```

The script performs the following steps inside a transaction:

1. Truncates Prisma-managed tables in Supabase (`users`, `chats`, `messages`, `votes`, `documents`, `suggestions`, `streams`, plus auth tables).
2. Imports users with derived `userType` (guests detected by `guest-` prefix).
3. Replays chats, messages, votes, documents, suggestions, and streams, translating enums to the Prisma format.
4. Runs verification by comparing Neon row counts with Supabase row counts; any mismatch aborts the run.

## 3. Post-migration checklist

- Run Prisma migrations to ensure schema parity: `pnpm prisma:deploy`.
- Seed optional fixtures (e.g., demo users): `pnpm db:seed`.
- Rotate secrets (`NEXTAUTH_SECRET`, provider secrets) if moving environments.
- Update environment variables to reference `DATABASE_URL` instead of `POSTGRES_URL`.
- Cut over application traffic to the Supabase connection string.

## 4. Rollback strategy

- Supabase: restore from point-in-time recovery or snapshot prior to migration.
- Neon: untouched by the script; remains as fallback.
- Application: revert `.env.local` to use Neon connection and redeploy.

## 5. Verification tooling

The migration script can be run in verification mode to validate a Supabase snapshot against Neon without writing:

```bash
NEON_DATABASE_URL="postgresql://..." \
SUPABASE_DATABASE_URL="postgresql://..." \
  pnpm ts-node --swc scripts/migrate-neon-to-supabase/index.ts --verify
```

This recomputes the row counts on both sides and exits non-zero if any mismatches occur.

## 6. Troubleshooting

- **Connection refused** – ensure tunnels/firewalls permit connections from your machine to both databases.
- **Foreign key violations** – run the script against a clean Supabase database or allow it to truncate tables automatically.
- **Enum mismatch errors** – confirm Supabase has run `pnpm prisma:deploy`; the migration depends on the generated enums.
