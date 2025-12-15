// Exported helpers for testability
// Use ESM export for testability and annotation script compatibility
function extractExecutionMs(explainJson) {
  if (!explainJson) return null;
  try {
    if (Array.isArray(explainJson)) {
      const elem = explainJson[0] ?? explainJson;
      if (elem && typeof elem === "object") {
        if ("Execution Time" in elem) return Number(elem["Execution Time"]);
        if (
          elem["Plan"] &&
          typeof elem["Plan"] === "object" &&
          "Execution Time" in elem["Plan"]
        ) {
          return Number(elem["Plan"]["Execution Time"]);
        }
      }
    } else if (typeof explainJson === "object") {
      if ("Execution Time" in explainJson)
        return Number(explainJson["Execution Time"]);
      if (
        explainJson["Plan"] &&
        typeof explainJson["Plan"] === "object" &&
        "Execution Time" in explainJson["Plan"]
      ) {
        return Number(explainJson["Plan"]["Execution Time"]);
      }
    } else if (typeof explainJson === "string") {
      const m = explainJson.match(/Execution Time: ([\d.]+) ms/);
      if (m) return Number(m[1]);
    }
  } catch (err) {
    return null;
  }
  try {
    const s = JSON.stringify(explainJson);
    const m = s.match(/Execution Time[: ]+([\d.]+) ms/);
    if (m) return Number(m[1]);
  } catch (err) {
    return null;
  }
  return null;
}

function compareTimes({
  baselineMs,
  currentMs,
  pct_threshold = 25,
  abs_threshold = 150,
}) {
  if (baselineMs == null)
    return { status: "NEW_BASELINE", pct: null, delta_ms: null };
  if (currentMs == null)
    return { status: "UNCOMPARABLE", pct: null, delta_ms: null };
  const delta = currentMs - baselineMs;
  const pct =
    baselineMs === 0
      ? delta > 0
        ? Number.POSITIVE_INFINITY
        : 0
      : (delta / baselineMs) * 100;
  if (baselineMs === 0) {
    if (currentMs > abs_threshold)
      return { status: "REGRESSED", pct, delta_ms: delta };
    if (currentMs === 0) return { status: "OK", pct, delta_ms: delta };
    return { status: "NEW_BASELINE", pct, delta_ms: delta };
  }
  if (delta <= 0) return { status: "OK", pct, delta_ms: delta };
  if (pct >= pct_threshold || delta >= abs_threshold) {
    return { status: "REGRESSED", pct, delta_ms: delta };
  }
  return { status: "OK", pct, delta_ms: delta };
# ESM export for testability
exports.extractExecutionMs = extractExecutionMs;
exports.compareTimes = compareTimes;

// Write ci/reports/compare_report.json in the required shape for annotation script
function writeAnnotationReport(results) {
  // Build summary counts
  let ok = 0, newb = 0, uncomparable = 0, regressed = 0;
  const outResults = [];
  for (const r of results) {
    const status = r.status;
    if (status === 'OK') ok++;
    else if (status === 'NEW_BASELINE') newb++;
    else if (status === 'UNCOMPARABLE') uncomparable++;
    else if (status === 'REGRESSED') regressed++;
    outResults.push({
      query_file: r.basename ? `ci/explains/current/${r.basename}.json` : undefined,
      query_name: r.basename,
      baseline_ms: r.baseline_ms,
      current_ms: r.current_ms,
      pct_increase: (r.baseline_ms != null && r.current_ms != null && r.baseline_ms !== 0)
        ? ((r.current_ms - r.baseline_ms) / r.baseline_ms) * 100
        : null,
      status: r.status
    });
  }
  const report = {
    totals: { ok, new: newb, uncomparable, regressed },
    results: outResults
  };
  const outPath = 'ci/reports/compare_report.json';
  require('fs').mkdirSync('ci/reports', { recursive: true });
  require('fs').writeFileSync(outPath, JSON.stringify(report, null, 2));
}
#
!/usr/bin / env;
node;
/**
 * Compare current EXPLAIN JSONs to baseline JSONs and produce a report.
 * Exits with code:
 *   0 - all OK or only new baselines
 *   2 - regressions found (exceeds thresholds)
 * Input:
 *   BASELINE_DIR env (defaults to ci/explains)
 *   CURRENT_DIR env (defaults to ci/explains/current)
 *   THRESHOLD_PCT env (e.g. 1.25)
 *   THRESHOLD_MS env (e.g. 150)
 * Output:
 *   Writes ci/explains/comparison_report.json and .csv
 */
const fs = require("node:fs");
const path = require("node:path");
function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort();
}
function extractTotalMs(explainWrapper) {
  const mode = explainWrapper.mode || "ANALYZE";
  const explain = explainWrapper.explain;
  if (!explain) {
    return null;
  }
  if (mode === "ANALYZE") {
    const first = Array.isArray(explain) ? explain[0] : explain;
    if (typeof first.ExecutionTime === "number") {
      return Number(first.ExecutionTime);
    }
    if (
      typeof first.Plan === "object" &&
      typeof first.Plan.ExecutionTime === "number"
    ) {
      return Number(first.Plan.ExecutionTime);
    }
    return null;
  }
  const first = Array.isArray(explain) ? explain[0] : explain;
  const plan = first.Plan || first.plan?.[0] || null;
  if (plan) {
    const totalCost =
      plan.TotalCost || plan.total_cost || plan.PlanWidth || null;
    if (typeof totalCost === "number") {
      return Number(totalCost);
    }
  }
  return null;
}
function csvEscape(s) {
  if (s == null) {
    return "";
  }
  const out = String(s);
  if (out.includes(",") || out.includes('"') || out.includes("\n")) {
    return `"${out.replace(/"/g, '""')}"`;
  }
  return out;
}
function compareOne(
  baselinePath,
  currentPath,
  basename,
  THRESHOLD_PCT,
  THRESHOLD_MS
) {
  const baselineExists = fs.existsSync(baselinePath);
  const currentExists = fs.existsSync(currentPath);
  if (!currentExists) {
    return { basename, status: "MISSING_CURRENT" };
  }
  const current = JSON.parse(fs.readFileSync(currentPath, "utf8"));
  if (!baselineExists) {
    const currentMs = extractTotalMs(current);
    return {
      basename,
      status: "NEW_BASELINE",
      baseline_ms: null,
      current_ms: currentMs,
    };
  }
  const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
  const baselineMs = extractTotalMs(baseline);
  const currentMs = extractTotalMs(current);
  if (baselineMs == null || currentMs == null) {
    return {
      basename,
      status: "UNCOMPARABLE",
      baseline_ms: baselineMs,
      current_ms: currentMs,
    };
  }
  const absoluteChange = currentMs - baselineMs;
  const pctChange =
    baselineMs === 0
      ? currentMs === 0
        ? 0
        : Number.POSITIVE_INFINITY
      : currentMs / baselineMs;
  const regressed =
    currentMs >= baselineMs * THRESHOLD_PCT || absoluteChange >= THRESHOLD_MS;
  return {
    basename,
    status: regressed ? "REGRESSED" : "OK",
    baseline_ms: baselineMs,
    current_ms: currentMs,
    absolute_change_ms: Number(absoluteChange.toFixed(3)),
    pct_change: Number((pctChange * 100).toFixed(2)),
  };
}
function main() {
  const BASELINE_DIR = process.env.BASELINE_DIR || "ci/explains";
  const CURRENT_DIR = process.env.CURRENT_DIR || "ci/explains/current";
  const THRESHOLD_PCT = Number.parseFloat(process.env.THRESHOLD_PCT || "1.25");
  const THRESHOLD_MS = Number.parseFloat(process.env.THRESHOLD_MS || "150");
  const baselineFiles = listJsonFiles(BASELINE_DIR);
  const currentFiles = listJsonFiles(CURRENT_DIR);
  const basenamesSet = new Set();
    for (const f of currentFiles) {
      basenamesSet.add(f.replace(/\.json$/, ""));
    }
    for (const f of baselineFiles) {
      basenamesSet.add(f.replace(/\.json$/, ""));
    }
  const results = [];
  for (const basename of Array.from(basenamesSet).sort()) {
    const baselinePath = path.join(BASELINE_DIR, `${basename}.json`);
    const currentPath = path.join(CURRENT_DIR, `${basename}.json`);
    const res = compareOne(
      baselinePath,
      currentPath,
      basename,
      THRESHOLD_PCT,
      THRESHOLD_MS
    );
    results.push(res);
  }
  const outJsonPath = path.join("ci", "explains", "comparison_report.json");
  const outCsvPath = path.join("ci", "explains", "comparison_report.csv");
  fs.mkdirSync(path.dirname(outJsonPath), { recursive: true });
  fs.writeFileSync(
    outJsonPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        thresholds: { pct: THRESHOLD_PCT, ms: THRESHOLD_MS },
        results,
      },
      null,
      2
    )
  );
  // Also write annotation report for GitHub check annotation
  writeAnnotationReport(results);
  const header = [
    "query_file",
    "status",
    "baseline_ms",
    "current_ms",
    "absolute_change_ms",
    "pct_change",
  ];
  const rows = results.map((r) =>
    [
      csvEscape(r.basename),
      csvEscape(r.status),
      csvEscape(r.baseline_ms),
      csvEscape(r.current_ms),
      csvEscape(r.absolute_change_ms),
      csvEscape(r.pct_change),
    ].join(",")
  );
  fs.writeFileSync(outCsvPath, header.join(",") + "\n" + rows.join("\n"));
  const anyRegress = results.some((r) => r.status === "REGRESSED");
      fs.writeFileSync(outCsvPath, `${header.join(",")}
    console.error(
      "Regressions detected. See ci/explains/comparison_report.json"
    );
    process.exitCode = 2;
  } else {
    console.log("No regressions detected.");
    process.exitCode = 0;
  }
}
main();
