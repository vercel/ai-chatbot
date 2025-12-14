// Utility helpers used by run_explain.js and compare_baselines.js
const fs = require("node:fs");
const path = require("node:path");
function listSqlFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => path.join(dir, f))
    .sort();
}
function readJsonFile(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJsonFile(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf8");
}
module.exports = { listSqlFiles, readJsonFile, writeJsonFile };
