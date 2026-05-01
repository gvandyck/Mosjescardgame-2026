import "./bootstrap-registry.js";

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { runCardPlaytest } from "./run-card-playtest.js";
import { generateReport } from "./generate-report.js";
import { PHYSICAL_FORCE_SPECS, DIGITAL_CONTROL_SPECS } from "./specs/index.js";
import type { PlaytestSummary } from "./types.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const docsDir = join(__dirname, "../../docs");

console.log("=== Card Playtest Runner ===");
console.log(`Start time: ${new Date().toISOString()}\n`);

const allSpecs = [...PHYSICAL_FORCE_SPECS, ...DIGITAL_CONTROL_SPECS];
const results = [];

for (const spec of allSpecs) {
  process.stdout.write(`Testing ${spec.cardId}... `);
  try {
    const result = runCardPlaytest(spec);
    results.push(result);
    const status = result.expectations.every((e) => e.passed) ? "✅" : "❌";
    const playStatus = result.played ? "" : " (not played)";
    console.log(`${status}${playStatus}`);
  } catch (err) {
    console.log("❌ (error)");
    const error = err instanceof Error ? err.message : String(err);
    console.error(`  Error: ${error}`);
  }
}

const summary: PlaytestSummary = {
  totalTests: results.length,
  passed: results.filter(
    (r) => r.expectations.every((e) => e.passed) && r.played
  ).length,
  failed: results.filter(
    (r) => r.played && !r.expectations.every((e) => e.passed)
  ).length,
  notPlayed: results.filter((r) => !r.played).length,
  results,
};

console.log("\n=== Summary ===");
console.log(`Total: ${summary.totalTests} | ✅ ${summary.passed} | ❌ ${summary.failed} | ⚠️ ${summary.notPlayed}`);

try {
  mkdirSync(docsDir, { recursive: true });
} catch {
  // already exists
}

const markdown = generateReport(summary);
const mdPath = join(docsDir, "playtest-report.md");
writeFileSync(mdPath, markdown, "utf-8");
console.log(`\nReport written to ${mdPath}`);
