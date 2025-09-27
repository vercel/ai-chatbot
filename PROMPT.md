<prompt>
Please analyze this codebase and create an AGENTS.md file at the repository root that gives precise, actionable guidance to agentic coding assistants working in this repo.

Emphasize an upfront Architecture and Modules Overview: describe the repository structure, major modules and their responsibilities, how modules interact and call each other, and which external services are used (databases, queues, storage, AI providers, telemetry, etc.).

Deliverable:
- A concise, comprehensive AGENTS.md written for agents (not humans), using short, dense bullet points.
- Start with an Architecture and Modules Overview section summarizing:
  - Primary app(s), major modules, and responsibilities
  - Key interactions/flows between modules (e.g., API -> services -> DB)
  - External services/integrations detected (DB, cache, storage, AI, telemetry)
- Prefer accuracy and verifiable commands over guesses. If something can’t be determined from the repo, say “Not found” or “Unknown—verify”.
- If an AGENTS.md already exists, improve and consolidate it (do not duplicate or delete useful content).

Prefix:
- Start the file with:
  # AGENTS.md
  This file provides guidance to AI coding agents when working with code in this repository.

What to include (fill with repo-specific details, not placeholders):
0) Architecture and Modules Overview
- High-level summary of the app(s) and runtime model.
- Major directories/modules and their responsibilities.
- Module interactions and data flow (what calls what, at a glance).
- External services/integrations and their purpose (DB, cache, storage, AI providers, telemetry) with file references.
- Critical paths (e.g., request lifecycle for key endpoints) and important entry points.

1) Repo structure and navigation
- Monorepo/package layout, primary apps, libraries, and entry points.
- Map key directories to responsibilities (API routes, DB layer, UI, hooks) and link to entry files.
- Note cross-module links (e.g., which modules import the DB layer or external services).
- How to quickly jump to a package/module (e.g., workspace filters).
- Where to find scripts/tasks (package.json scripts, Makefile/Justfile/Taskfile, Rakefile, tox, Nix, Bazel, etc.).

2) Setup and dev environment
- Bootstrap commands (install tools, language versions, workspace setup).
- Package manager(s) and the exact commands used (pnpm/yarn/npm; pip/poetry/uv; cargo; go; gradle/maven; bundler; mix; .NET).
- Required local services (DB, queues), how to start them (docker compose, devcontainer, Nix), and any .env files or secrets needed.
- Explicitly list detected external services with links to config/env (e.g., Postgres via Drizzle, Redis, Blob storage, AI Gateway, telemetry/OTEL).

3) Build, lint, format, type-check
- The exact commands to build, lint, format, and run type checks.
- How to run them for a single package/module.

4) Test instructions (including single-test focus)
- How to run all tests, one package’s tests, one file, and a single test case.
- Snapshot/update steps if applicable (e.g., insta, jest -u, pytest --snapshot-update).
- Coverage commands.

5) Run and debug
- Commands to run the app(s) locally (web/CLI/service) and common flags for non-interactive runs.
- Debug tips (ports, env vars, dev server, hot reload).
- Show where requests enter the system (routes/handlers) and which modules they invoke.

6) CI parity
- CI workflows to mirror locally (point to .github/workflows).
- Required checks that must pass before merging and how to run them locally.
- Any branch/PR naming rules and commit conventions (e.g., Conventional Commits).

7) Code conventions
- Imports, formatting, file layout, naming, types, error handling, logging, public API patterns.
- Test conventions (structure, fixtures/mocks, data seeding).
- Language/framework-specific style notes extracted from config files (ESLint/Prettier, mypy/ruff/flake8/black, golangci-lint, rustfmt/clippy, ktlint, etc.).
- Note common service access patterns (e.g., DB client instantiation, caching strategy) and where to add/extend modules safely.

8) Tools and configs to respect
- Pre-commit hooks and how to run them (pre-commit run --all-files; or tool-specific).
- Editor/formatter settings (.editorconfig, IDE settings), codegen steps, schema/migration tools.
- Any Cursor or Copilot rules (from .cursor/rules/, .cursorrules, .github/copilot-instructions.md) must be summarized.

9) Agent-safe operations
- Commands that are safe to run in a non-interactive/sandboxed environment (no network, no secrets).
- Tests to skip or environment gates to set if needed (note env vars used by tests to skip network/integration).
- Safe ways to inspect module relationships offline (ripgrep queries) and generate quick dependency summaries.

10) Common pitfalls
- Flaky tests to avoid or how to stabilize.
- Long builds and how to scope/parallelize.
- Areas/files agents should not modify (e.g., vendored code, generated files, migration history).

How to gather information:
- Use ripgrep (rg) to discover scripts, configs, and workflows quickly and accurately. Prefer rg over grep/ls -R.
  Examples:
  - rg -n "scripts" --package.json
  - rg -n "test" -g "!node_modules" -S
  - rg -n "(pytest|tox|nox|ruff|black|mypy|poetry|uv)" -S
  - rg -n "(cargo|clippy|rustfmt|insta)" -S
  - rg -n "(golangci|go test|gotestsum)" -S
  - rg -n "(gradle|mvn|ktlint|spotless)" -S
  - rg -n "(pre-commit|.editorconfig|Makefile|Justfile|Taskfile|docker-compose|devcontainer|nix|Bazel|WORKSPACE)" -S
  - rg -n "name|private|workspaces" --package.json
  - rg -n "on:|jobs:" .github/workflows
  - rg -n "from \"@/|lib/|app/|components/|hooks/\"" -S   # cross-module imports
  - rg -n "(POSTGRES|REDIS|BLOB|AI_GATEWAY|OTEL|OPENTELEMETRY|VERCEL)" -S   # services/env usage
  - rg -n "export (function|const|class|type)" "lib app components" -S       # module entry points
- Read config files directly and extract real commands and flags. Do not invent commands not present in the repo.
- If multiple ecosystems are detected, include subsections per language/tool with the correct commands.

Style and scope:
- Keep it practical and succinct (roughly 40–80 lines; expand only when needed).
- Use bullet points and code-formatted commands; prefer links/paths to files over long explanations.
- Reference exact file paths for config and workflows.
- If uncertain, add a short “Unknown—verify” note.
- Front‑load a brief Architecture and Modules Overview before deeper sections.

Finally:
- Write AGENTS.md at the repo root. If updating an existing file, improve clarity and correctness while preserving any repo-specific guidance that is still valid.
</prompt>
