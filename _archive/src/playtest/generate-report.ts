import type { PlaytestResult, PlaytestSummary } from "./types.js";

export function generateReport(summary: PlaytestSummary): string {
  const lines: string[] = [];
  const now = new Date().toISOString().split("T")[0];

  lines.push("# Card Playtest Report");
  lines.push("");
  lines.push(`Generated: ${now}`);
  lines.push("");

  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total tests: ${summary.totalTests}`);
  lines.push(`- ✅ Passed: ${summary.passed}`);
  lines.push(`- ❌ Failed: ${summary.failed}`);
  lines.push(`- ⚠️  Not played: ${summary.notPlayed}`);
  lines.push("");

  if (summary.passed === summary.totalTests) {
    lines.push(
      "🎉 **All cards executed as expected!** No issues detected."
    );
  } else {
    const passRate = (
      ((summary.passed / summary.totalTests) * 100).toFixed(1)
    );
    lines.push(
      `Pass rate: ${passRate}% — ${summary.failed + summary.notPlayed} cards need investigation.`
    );
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Results");
  lines.push("");

  for (const result of summary.results) {
    const icon = getIcon(result);
    const status = getStatus(result);
    lines.push(`### ${icon} ${result.cardId} — ${result.cardName}`);
    lines.push("");
    lines.push(`**Status:** ${status}`);
    lines.push("");
    lines.push(`> ${result.description}`);
    lines.push("");

    if (result.expectations.length > 0) {
      lines.push("**Expectations:**");
      lines.push("");
      for (const exp of result.expectations) {
        const check = exp.passed ? "✅" : "❌";
        lines.push(`- ${check} ${exp.description}`);
        if (exp.details) {
          lines.push(`  > ${exp.details}`);
        }
      }
      lines.push("");
    }

    if (!result.expectations.every((e) => e.passed)) {
      lines.push("**Diagnosis:**");
      lines.push("");
      lines.push(`> ${result.diagnosis}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function getIcon(result: PlaytestResult): string {
  if (!result.played) return "⚠️";
  if (result.expectations.every((e) => e.passed)) return "✅";
  return "❌";
}

function getStatus(result: PlaytestResult): string {
  if (!result.played) return "Not Played";
  const failedCount = result.expectations.filter((e) => !e.passed).length;
  if (failedCount === 0) return "Passed";
  return `Failed (${failedCount}/${result.expectations.length} checks)`;
}
