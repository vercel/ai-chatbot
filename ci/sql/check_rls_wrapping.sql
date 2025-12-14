-- check_rls_wrapping.sql
-- Heuristic detection: policies referencing auth.* or current_setting() without SELECT-wrapping
-- Produces rows: schema_name, table_name, policy_name, clause_type, expression, heuristic_status

WITH policies AS (
  SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    pol.polname AS policy_name,
    pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
    pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expr
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
)
SELECT
  schema_name,
  table_name,
  policy_name,
  'USING' AS clause_type,
  using_expr AS expression,
  CASE
    WHEN using_expr ~* 'auth\\.' OR using_expr ~* 'current_setting' THEN
      CASE
        WHEN using_expr ~* '\\(\\s*select\\s+auth\\.' OR using_expr ~* '\\(\\s*select\\s+current_setting' THEN 'wrapped'
        ELSE 'not_wrapped'
      END
    ELSE 'no_auth_or_current_setting'
  END AS heuristic_status
FROM policies
WHERE using_expr IS NOT NULL
  AND (using_expr ~* 'auth\\.' OR using_expr ~* 'current_setting')

UNION ALL

SELECT
  schema_name,
  table_name,
  policy_name,
  'WITH CHECK' AS clause_type,
  with_check_expr AS expression,
  CASE
    WHEN with_check_expr ~* 'auth\\.' OR with_check_expr ~* 'current_setting' THEN
      CASE
        WHEN with_check_expr ~* '\\(\\s*select\\s+auth\\.' OR with_check_expr ~* '\\(\\s*select\\s+current_setting' THEN 'wrapped'
        ELSE 'not_wrapped'
      END
    ELSE 'no_auth_or_current_setting'
  END AS heuristic_status
FROM policies
WHERE with_check_expr IS NOT NULL
  AND (with_check_expr ~* 'auth\\.' OR with_check_expr ~* 'current_setting')

ORDER BY schema_name, table_name, policy_name, clause_type;
