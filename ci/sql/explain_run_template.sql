-- explain_run_template.sql
-- Replace the SELECT below with a query you want to profile.
-- Output: single JSON plan (EXPLAIN FORMAT JSON)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT *
FROM public.some_table
WHERE some_column = 'example_value'
LIMIT 50;
