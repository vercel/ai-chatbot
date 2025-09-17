# Changelog

## [Unreleased]
### Added
- Migrated the data layer from Neon/Drizzle to Supabase Postgres managed by Prisma.
- Integrated NextAuth.js 5 with the Prisma adapter storing sessions and accounts in Postgres.
- Added Prisma-based migrations, seed script, and data migration tooling from Neon → Supabase.
- Documented the new architecture (ADR, database ERD, migration playbook) and expanded README instructions.
- Introduced lint/test/typecheck scripts aligning with the Prisma workflow.

### Changed
- Replaced all database queries with Prisma-backed implementations and normalized enums.
- Updated authentication flows to rely on database sessions and Prisma-managed users.
- Refreshed environment variable requirements and `.env.example` for Supabase + NextAuth.

### Removed
- Deprecated Drizzle ORM schemas, migrations, and Neon-specific utilities.
