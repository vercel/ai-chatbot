# ADR-0001: Adopt Supabase Postgres with Prisma and NextAuth

## Status
Accepted – 2024-11-08

## Context
The application previously relied on Neon Postgres through Drizzle ORM with custom SQL helpers. Authentication was implemented via NextAuth credentials with ad-hoc password storage and no persistent session tables. This created several issues:

- Lacked a unified ORM with migrations and schema introspection.
- Authentication data was stored alongside app tables without referential guarantees.
- JSON blobs (messages, documents) were difficult to index and reason about.
- Running locally required Neon connectivity and bespoke migration scripts.

Supabase offers a managed Postgres instance with generous free tier, point-in-time recovery, and observability tools. Prisma provides a type-safe ORM with migrations, schema modeling, and excellent DX. NextAuth 5 with the Prisma adapter stores sessions/accounts directly in Postgres, aligning auth and app data under a single connection string.

## Decision
- Replace Neon with Supabase as the managed Postgres provider.
- Replace Drizzle ORM with Prisma Client for all database access.
- Normalize the schema around Prisma models while retaining JSON where structure is dynamic.
- Use NextAuth 5 with the Prisma adapter, storing sessions in Postgres.
- Provide scripts and documentation for migrating Neon data into Supabase using Prisma-compatible schema.

## Consequences
- Prisma now manages migrations and schema changes (`prisma/migrations`).
- All database access flows through `lib/db/queries.ts`, which exposes domain-specific helpers backed by Prisma.
- NextAuth sessions persist in the `sessions`, `accounts`, and `verification_tokens` tables in Supabase.
- Developers run `pnpm prisma:migrate` and `pnpm db:seed` during setup.
- Data migration from the previous Neon database is handled through `scripts/migrate-neon-to-supabase/index.ts` supporting dry runs and verification.
- Documentation (`README.md`, `MIGRATION.md`, `docs/DATABASE.md`) captures the new architecture and operational playbooks.
