# CI Scripts for Baseline Automation

- `run_explain.js`: Runs EXPLAIN on all queries in ci/queries/ and writes JSON output to ci/explains/current/.
- `compare_baselines.js`: Compares current EXPLAIN results to baselines in ci/explains/ and writes a report.
- `compare_baselines.test.js`: Unit tests for compare_baselines.js.
- `copy_new_baselines.sh`: Copies new EXPLAIN JSONs from current/ to baselines if not already present (used by baseline PR workflow).
