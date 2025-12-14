# Query Baseline Directory

Place your .sql files here for performance regression testing. Each file should contain a single query to be tested with EXPLAIN. The automation will run EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) on each file and compare results to baselines in ci/explains.

- Add new queries as needed for coverage.
- Baseline JSONs will be generated in ci/explains/ (commit these for baseline tracking).
- Current run outputs go to ci/explains/current/.
