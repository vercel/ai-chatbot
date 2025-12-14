# Database Performance Regression Automation

This project uses automated EXPLAIN analysis to detect query performance regressions in Supabase/Postgres. The workflow is based on Supabase best practices and runs in CI via GitHub Actions.
## How it works

- Place `.sql` files for queries to test in `ci/queries/`.
- Baseline EXPLAIN JSONs are stored in `ci/explains/` (commit these for tracking).
- On each run, the workflow runs EXPLAIN on all queries and compares to baselines.
- If a query regresses (exceeds thresholds), the workflow fails and a report is generated.
## Usage

1. Add or update `.sql` files in `ci/queries/`.
## Thresholds

- Default: 25% slower or 150ms slower triggers a regression.
## Security

- Uses a read-only database user (set `DATABASE_URL_READONLY` secret in GitHub).
## Files

- `ci/scripts/run_explain.js`: Runs EXPLAIN on all queries in `ci/queries/` and writes JSON output to `ci/explains/current/`.
## Updating Baselines

If a query is intentionally improved, copy the current EXPLAIN JSON from `ci/explains/current/` to `ci/explains/` and commit the change. This updates the baseline for future comparisons.
## Running Locally

You can run the scripts locally for development:
## GitHub Actions Workflow

The workflow `.github/workflows/perf-regression.yml` runs on PRs, schedule, or manually. It:
## Reference

This automation is based on Supabase's recommended approach for query performance regression testing. For more details, see the comments in each script and the original Supabase issue.
# Database Best-Practice Checks for TiQology

This document explains the automated checks for RLS policy security, index coverage, and query performance in the TiQology project.

## What is Checked?

- **RLS Policy Audit:** Detects unsafe policy expressions referencing `auth.*` or `current_setting()` without SELECT-wrapping.
- **Index Coverage:** Ensures all columns referenced in RLS policies are indexed.
- **Query Performance:** Runs `EXPLAIN ANALYZE` on top queries and compares results to baselines.

## How It Works

- Checks run automatically via GitHub Actions (see `.github/workflows/db_checks.yml`).
- SQL scripts are in `ci/sql/`, shell scripts in `ci/scripts/`, and query files in `ci/queries/`.
- Artifacts and reports are saved in `ci/artifacts/` after each run.

## Setup Steps

1. **Add a read-only `DATABASE_URL` secret** to your GitHub repo.
2. **Add your top queries** as `.sql` files in `ci/queries/`.
3. **Review artifacts and alerts** after each run. Fix any RLS or index issues promptly.
4. **Update baselines** for query performance as needed (commit new JSONs to a protected branch).

## Responding to Alerts

- If a run fails, review the artifacts in GitHub Actions.
- Address any RLS or index issues as recommended in the reports.
- For query regressions, investigate and optimize the affected queries.

## Best Practices

- Use a least-privilege DB user for CI checks.
- Regularly review and update your top queries and baselines.
- Document any manual overrides or exceptions.

---

For help or to update this process, contact the TiQology engineering team or your database administrator.
