// .github/actions/post-compare-summary.js
// Posts a concise summary of the compare_baselines report as a GitHub Check Run.
import fs from "fs";
import https from "https";
import process from "process";

const fetcher = global.fetch
  ? global.fetch.bind(global)
  : (url, opts) =>
      new Promise((resolve, reject) => {
        const body = opts && opts.body ? opts.body : null;
        const parsed = new URL(url);
        const headers = opts && opts.headers ? opts.headers : {};
        const req = https.request(
          {
            method: opts.method || "GET",
            hostname: parsed.hostname,
            path: parsed.pathname + parsed.search,
            headers,
          },
          (res) => {
            let data = "";
            res.on("data", (d) => (data += d));
            res.on("end", () => {
              resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                text: async () => data,
                json: async () => JSON.parse(data),
              });
            });
          }
        );
        req.on("error", reject);
        if (body) req.write(body);
        req.end();
      });
function safeReadJSON(path) {
  try {
    const s = fs.readFileSync(path, "utf8");
    return JSON.parse(s);
  } catch (err) {
    return null;
  }
}
function buildSummary(report) {
  if (!report || !report.totals) return "No compare report available.";
  const t = report.totals;
  return `Results: ${t.ok} OK • ${t.new} NEW_BASELINE • ${t.uncomparable} UNCOMPARABLE • ${t.regressed} REGRESSED\n\nFor details, download the compare-report artifact from the workflow run.`;
}
function buildAnnotations(report) {
  const annotations = [];
  if (!report || !Array.isArray(report.results)) return annotations;
  for (const r of report.results) {
    if (r.status === "REGRESSED") {
      annotations.push({
        path: r.query_file || "ci/queries",
        start_line: 1,
        end_line: 1,
        annotation_level: "failure",
        message: `${r.query_name || r.query_file} regressed: baseline ${r.baseline_ms ?? "N/A"}ms → current ${r.current_ms ?? "N/A"}ms (${(r.pct_increase ?? 0).toFixed(1)}%)`,
      });
      if (annotations.length >= 10) break;
    }
  }
  return annotations;
}
async function createCheckRun(
  token,
  owner,
  repo,
  head_sha,
  summaryText,
  annotations = []
) {
  const url = `https://api.github.com/repos/${owner}/${repo}/check-runs`;
  const body = {
    name: "compare_baselines",
    head_sha,
    status: "completed",
    conclusion: annotations.some((a) => a.annotation_level === "failure")
      ? "failure"
      : "success",
    output: {
      title: "Performance comparison summary",
      summary: summaryText,
      annotations: annotations
        .map((a) => ({
          path: a.path,
          start_line: a.start_line,
          end_line: a.end_line,
          annotation_level: a.annotation_level,
          message: a.message,
        }))
        .slice(0, 50),
    },
  };
  const res = await fetcher(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    console.error("Failed to create check run:", res.status, txt);
    return;
  }
  const json = await res.json();
  console.log("Created check run id:", json.id);
}
(async () => {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.warn("GITHUB_TOKEN not set; skipping posting check.");
      process.exit(0);
    }
    const repo_full = process.env.GITHUB_REPOSITORY;
    const [owner, repo] = (repo_full || "").split("/");
    const sha = process.env.GITHUB_SHA;
    const reportPath =
      process.env.REPORT_PATH || "ci/reports/compare_report.json";
    const report = safeReadJSON(reportPath);
    const summary = buildSummary(report);
    const annotations = buildAnnotations(report);
    await createCheckRun(token, owner, repo, sha, summary, annotations);
  } catch (err) {
    console.error("Error posting compare summary:", err);
    process.exit(0);
  }
})();
