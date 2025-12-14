#!/usr/bin/env bash
set -euo pipefail
CONN=${PG_CONN:-${DATABASE_URL:-}}
if [[ -z "$CONN" ]]; then
  echo "Please set DATABASE_URL or PG_CONN"
  exit 2
fi
OUT_DIR=${OUT_DIR:-./ci/artifacts/explain}
mkdir -p "$OUT_DIR"
QUERIES_DIR=${QUERIES_DIR:-ci/queries}
THRESHOLD_MS=${THRESHOLD_MS:-150}  # example threshold in ms for alert — configurable
for qfile in "$QUERIES_DIR"/*.sql; do
  [ -e "$qfile" ] || continue
  qname=$(basename "$qfile" .sql)
  echo "Running EXPLAIN for $qname..."
  psql "$CONN" -v ON_ERROR_STOP=1 -q -t -A -c "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) $(cat "$qfile")" > "$OUT_DIR/${qname}_explain.json"
  total_time_ms=$(jq '.[0].Plan["Execution Time"] + .[0].Plan["Planning Time"]' "$OUT_DIR/${qname}_explain.json" 2>/dev/null || jq '.[0].Plan["Execution Time"]' "$OUT_DIR/${qname}_explain.json")
  echo "Query $qname total_time_ms=$total_time_ms"
  if [ -f "$OUT_DIR/${qname}_baseline.json" ]; then
    baseline_time=$(jq '.[0].Plan["Execution Time"] + .[0].Plan["Planning Time"]' "$OUT_DIR/${qname}_baseline.json" 2>/dev/null || jq '.[0].Plan["Execution Time"]' "$OUT_DIR/${qname}_baseline.json")
    increase=$(echo "scale=3; if ($baseline_time == 0) { 0 } else { 100 * ($total_time_ms - $baseline_time) / $baseline_time }" | bc -l)
    echo "Baseline: $baseline_time ms, increase: $increase %"
    percent_alert_threshold=${PERCENT_ALERT_THRESHOLD:-25}
    abs_increase=$(echo "$total_time_ms - $baseline_time" | bc -l)
    abs_increase_ms=$(printf "%.0f" "$abs_increase")
    percent_increase=$(printf "%.3f" "$increase")
    if (( $(echo "$percent_increase > $percent_alert_threshold" | bc -l) )) && (( abs_increase_ms > THRESHOLD_MS )); then
      echo "ALERT: $qname exceeded thresholds (pct $percent_increase, abs ${abs_increase_ms}ms)"
      echo "${qname},${baseline_time},${total_time_ms},${percent_increase},${abs_increase_ms}" >> "$OUT_DIR/explain_alerts.csv"
    fi
  else
    cp "$OUT_DIR/${qname}_explain.json" "$OUT_DIR/${qname}_baseline.json"
  fi
done
if [ -f "$OUT_DIR/explain_alerts.csv" ]; then
  echo "One or more explain checks triggered alerts. See $OUT_DIR/explain_alerts.csv"
  exit 5
fi
echo "All explain checks completed successfully."
exit 0
