#!/usr/bin/env node
/**
 * Run EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) on each SQL file and save JSON outputs.
 * Usage: node run_explain.js <queries_dir> <out_dir>
 * Requires env var DATABASE_URL to be set (read-only user).
 */
const fs = require("node:fs");
const path = require("node:path");
const { listSqlFiles } = require("./utils");
const { Client } = require("pg");
async function run() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node run_explain.js <queries_dir> <out_dir>");
    process.exit(2);
  }
  const [queriesDir, outDir] = args;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is required.");
    process.exit(2);
  }
  const files = listSqlFiles(queriesDir);
  if (files.length === 0) {
    console.error("No .sql files found in", queriesDir);
    process.exit(0);
  }
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  for (const file of files) {
    const basename = path.basename(file, ".sql");
    const outPath = path.join(outDir, `${basename}.json`);
    const sql = fs.readFileSync(file, "utf8").trim();
    if (!sql) {
      console.warn(`Skipping empty file ${file}`);
      continue;
    }
    // Prepend EXPLAIN clause. We try ANALYZE; if not allowed, fall back to planner-only.
    const explainAnalyze = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`;
    const explainPlanner = `EXPLAIN (FORMAT JSON) ${sql}`;
    try {
      const res = await client.query(explainAnalyze);
      const json = parsePgExplainResult(res);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(
        outPath,
        JSON.stringify({ explain: json, mode: "ANALYZE" }, null, 2)
      );
      console.log(`Wrote ${outPath} (ANALYZE)`);
    } catch (err) {
      console.warn(
        `ANALYZE failed for ${file}: ${err.message}. Falling back to planner-only EXPLAIN`
      );
      try {
        const res2 = await client.query(explainPlanner);
        const json2 = parsePgExplainResult(res2);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(
          outPath,
          JSON.stringify({ explain: json2, mode: "PLANNER" }, null, 2)
        );
        console.log(`Wrote ${outPath} (PLANNER)`);
      } catch (err2) {
        console.error(`EXPLAIN failed for ${file}:`, err2);
        process.exit(3);
      }
    }
  }
  await client.end();
  process.exit(0);
}
function parsePgExplainResult(pgResult) {
  if (!pgResult || !pgResult.rows || pgResult.rows.length === 0) {
    throw new Error("No result from EXPLAIN");
  }
  const row = pgResult.rows[0];
  const firstVal = row[Object.keys(row)[0]];
  if (typeof firstVal === "object") {
    return firstVal;
  }
  try {
    return JSON.parse(firstVal);
  } catch {
    try {
      return JSON.parse(firstVal.trim());
    } catch {
      throw new Error("Unable to parse EXPLAIN JSON result");
    }
  }
}
run().catch((err) => {
  console.error(err);
  process.exit(4);
});
