-- check_index_coverage.sql
-- For each policy USING or WITH CHECK expression, extract simple column references (heuristic)
-- and check whether an index exists on the referenced column for that table.
-- Output: schema_name, table_name, policy_name, clause_type, column, has_index (boolean), suggested_index_sql

WITH policies AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    c.oid     AS table_oid,
    pol.polname AS policy_name,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expr
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
),

-- Heuristic extractor: find tokens like table_column or just column names using regex.
-- This will not catch every possible expression (e.g., JSON path usage). Manual review required.
extracted AS (
  SELECT
    schema_name,
    table_name,
    table_oid,
    policy_name,
    'USING' AS clause_type,
    regexp_matches(using_expr, '([a-zA-Z_][a-zA-Z0-9_]*)', 'g') AS tokens,
    using_expr AS expression
  FROM policies
  WHERE using_expr IS NOT NULL

  UNION ALL

  SELECT
    schema_name,
    table_name,
    table_oid,
    policy_name,
    'WITH CHECK' AS clause_type,
    regexp_matches(with_check_expr, '([a-zA-Z_][a-zA-Z0-9_]*)', 'g') AS tokens,
    with_check_expr AS expression
  FROM policies
  WHERE with_check_expr IS NOT NULL
),

tokens AS (
  -- Expand regex array matches into rows & filter for plausible column names
  SELECT
    schema_name,
    table_name,
    table_oid,
    policy_name,
    clause_type,
    expression,
    (tokens)[1] AS token
  FROM extracted
),
-- Filter tokens to likely column names by verifying they exist in the table
cols AS (
  SELECT
    t.schema_name,
    t.table_name,
    t.table_oid,
    t.policy_name,
    t.clause_type,
    t.expression,
    t.token AS column_candidate,
    a.attname AS actual_column
  FROM tokens t
  JOIN pg_attribute a ON a.attrelid = t.table_oid AND a.attname = t.token
  WHERE a.attnum > 0 AND NOT a.attisdropped
),

-- For each actual_column, check for an index on the table that includes it
indexed AS (
  SELECT
    c.schema_name,
    c.table_name,
    c.policy_name,
    c.clause_type,
    c.expression,
    c.actual_column,
    EXISTS (
      SELECT 1
      FROM pg_index idx
      JOIN pg_class ic ON ic.oid = idx.indexrelid
      WHERE idx.indrelid = c.table_oid
        AND (SELECT bool_or(attnum = ANY (idx.indkey)) FROM pg_attribute WHERE attrelid = c.table_oid AND attname = c.actual_column)
    ) AS has_index
  FROM cols c
)

SELECT
  schema_name,
  table_name,
  policy_name,
  clause_type,
  actual_column AS column,
  has_index,
  CASE WHEN NOT has_index THEN
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_' || table_name || '_' || actual_column || ' ON ' || schema_name || '.' || table_name || '(' || actual_column || ');'
  ELSE NULL END AS suggested_index_sql
FROM indexed
ORDER BY schema_name, table_name, policy_name, column;
