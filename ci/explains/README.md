# Baseline EXPLAIN Results

This directory stores the baseline EXPLAIN JSON outputs for each query in ci/queries. Commit these files to version control to track performance over time.

- Baseline files: <queryname>.json (from EXPLAIN)
- Current run: ci/explains/current/<queryname>.json
- Comparison report: ci/explains/comparison_report.json, .csv

Update baselines when intentional improvements are made.
