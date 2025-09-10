# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes and API (`app/api/*`).
- `components/`: Reusable React components (PascalCase files/dirs).
- `hooks/`: React hooks (`useX` naming).
- `lib/`: Server utilities and DB (`lib/db/{schema,queries,migrate,migrations}/`).
- `public/`: Static assets.
- `docs/`: Project documentation.
- `tests/`: Playwright tests — `tests/e2e/*` and `tests/routes/*`.
- `styles`: Tailwind is configured via `tailwind.config.ts` and `postcss.config.mjs`.

## Build, Test, and Development Commands
- `pnpm dev`: Run the app locally on `http://localhost:3000`.
- `pnpm build`: Run DB migrations then `next build`.
- `pnpm start`: Start the production server.
- `pnpm test`: Run Playwright tests; a dev server is started automatically.
- `pnpm lint` / `pnpm lint:fix`: ESLint + Biome lint (writes safe fixes).
- `pnpm format`: Format with Biome.
- Database: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`, `pnpm db:push`.

Ensure `.env.local` exists (see `.env.example`) before building/testing.

## Coding Style & Naming Conventions
- Language: TypeScript, 2‑space indent, 80‑char line width, single quotes, semicolons (Biome).
- Linting: ESLint (`next/core-web-vitals`, Tailwind plugin) + Biome.
- React: Components in PascalCase, hooks start with `use*`.
- Routes/API: Use kebab-case filenames inside `app/` and colocate route handlers under `app/api/<route>/route.ts`.

## Testing Guidelines
- Framework: Playwright (`playwright.config.ts`). Tests live in `tests/` and end with `.test.ts`.
- Groups: `e2e` UI flows; `routes` API behaviors.
- Run: `pnpm test` (uses `PORT`/`baseURL` if set). Keep tests isolated; prefer helpers in `tests/{fixtures,helpers}.ts`.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (e.g., `feat:`, `fix:`, `chore:`). Keep summaries under 72 chars.
- PRs: Provide a clear description, link issues, add screenshots/GIFs for UI, and list test coverage for changes.
- Pre‑merge checklist: `pnpm lint`, `pnpm format`, `pnpm test`, update `README.md`/`docs/` and `.env.example` if needed.

## Security & Configuration Tips
- Never commit secrets. Use `.env.local` (required: `POSTGRES_URL`, `AUTH_SECRET`; see `.env.example` for others like `AI_GATEWAY_API_KEY`, `REDIS_URL`, WorkOS keys).
- DB migrations: run locally via `pnpm db:migrate`; avoid editing files under `lib/db/migrations` by hand.
