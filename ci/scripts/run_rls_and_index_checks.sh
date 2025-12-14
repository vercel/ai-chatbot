#!/usr/bin/env bash
set -euo pipefail
# Environment:
# - PG_CONN or DATABASE_URL must be set (libpq connection string or postgres://)
CONN=${PG_CONN:-${DATABASE_URL:-}}
if [[ -z "$CONN" ]]; then
  echo "Please set DATABASE_URL or PG_CONN"
  exit 2
fi
OUT_DIR=${OUT_DIR:-./ci/artifacts}
mkdir -p "$OUT_DIR"
echo "Running RLS wrapping check..."
psql "$CONN" -At -F $'\t' -f ci/sql/check_rls_wrapping.sql > "$OUT_DIR/rls_wrapping.tsv" || true
echo "Running index coverage check..."
psql "$CONN" -At -F $'\t' -f ci/sql/check_index_coverage.sql > "$OUT_DIR/index_coverage.tsv" || true
# Determine exit code: fail if rls_wrapping has any 'not_wrapped' rows
if grep -q $'\tnot_wrapped\t' "$OUT_DIR/rls_wrapping.tsv" 2>/dev/null || grep -q 'not_wrapped' "$OUT_DIR/rls_wrapping.tsv" 2>/dev/null; then
  echo "RLS wrapping issues detected. See $OUT_DIR/rls_wrapping.tsv"
  exit 3
fi
# Fail if index coverage shows any has_index = f
if awk -F $'\t' '$5 == "f" { found=1 } END { if (found) exit 4 }' "$OUT_DIR/index_coverage.tsv" 2>/dev/null; then
  echo "Index coverage issues detected. See $OUT_DIR/index_coverage.tsv"
  exit 4
fi
echo "RLS and index checks passed."
exit 0
