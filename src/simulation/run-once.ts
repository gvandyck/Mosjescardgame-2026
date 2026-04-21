/**
 * Phase 9 — Run Once Script
 *
 * Standalone Node script that runs the 100-game simulation and writes results
 * to /docs/simulation-report.json and /docs/simulation-report.md.
 *
 * Usage:
 *   npx tsx src/simulation/run-once.ts
 */

// Bootstrap all card registrations before anything else
import "./bootstrap-registry.js";

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { runSimulation } from "./run-simulation.js";
import type { SimulationReport, MatchupResult } from "./run-simulation.js";
import type { CardId } from "../types/card-id.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const docsDir = join(__dirname, "../../docs");

// ─── Run simulation ───────────────────────────────────────────────────────────

console.log("=== Mosjescardgame Simulation — 100 games ===");
console.log(`Start time: ${new Date().toISOString()}`);

const startTime = Date.now();
const report = runSimulation({ gamesPerMatchup: 33, maxTurnsPerGame: 60 });
const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

console.log(`\nSimulation complete in ${elapsed}s`);
console.log(`Total games: ${report.totalGames}`);
console.log(`Crashes:     ${report.crashes.length}`);
console.log(`Timeouts:    ${report.timeouts.length}`);

// ─── Write JSON ───────────────────────────────────────────────────────────────

try {
  mkdirSync(docsDir, { recursive: true });
} catch {
  // already exists
}

const jsonPath = join(docsDir, "simulation-report.json");
writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf-8");
console.log(`\nJSON written to ${jsonPath}`);

// ─── Write Markdown ───────────────────────────────────────────────────────────

function pct(n: number, total: number): string {
  if (total === 0) return "0%";
  return `${((n / total) * 100).toFixed(1)}%`;
}

function buildMarkdown(r: SimulationReport): string {
  const lines: string[] = [];
  lines.push("# Simulation Report");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total games: ${r.totalGames}`);
  lines.push(`- Crashes: ${r.crashes.length}${r.crashes.length > 0 ? " — see list below" : ""}`);
  lines.push(`- Timeouts: ${r.timeouts.length} (${pct(r.timeouts.length, r.totalGames)} of games)`);
  lines.push("");

  if (r.crashes.length > 0) {
    lines.push("### Crash Details");
    lines.push("");
    for (const c of r.crashes) {
      lines.push(`- Seed ${c.seed}: \`${c.error}\``);
    }
    lines.push("");
  }

  if (r.timeouts.length > 0) {
    const timeoutList = r.timeouts.join(", ");
    lines.push("### Timeout Seeds");
    lines.push("");
    lines.push(`Seeds: ${timeoutList}`);
    lines.push("");
  }

  // ── Win Rates by Matchup ─────────────────────────────────────────────────
  lines.push("## Win Rates by Matchup");
  lines.push("");
  lines.push("| Matchup | P1 Wins | P2 Wins | Timeouts | Avg Turns |");
  lines.push("|---------|---------|---------|----------|-----------|");

  for (const mr of r.matchupResults) {
    const valid = mr.gamesPlayed - mr.timeouts;
    const p1pct = pct(mr.player1Wins, mr.gamesPlayed);
    const p2pct = pct(mr.player2Wins, mr.gamesPlayed);
    const flag65 =
      mr.gamesPlayed > 0 && (mr.player1Wins / mr.gamesPlayed > 0.65 || mr.player2Wins / mr.gamesPlayed > 0.65)
        ? " ⚠️"
        : "";
    lines.push(
      `| ${mr.player1Deck} vs ${mr.player2Deck} | ${mr.player1Wins} (${p1pct})${mr.player1Wins / mr.gamesPlayed > 0.65 ? flag65 : ""} | ${mr.player2Wins} (${p2pct})${mr.player2Wins / mr.gamesPlayed > 0.65 ? flag65 : ""} | ${mr.timeouts} | ${mr.avgTurns.toFixed(1)} |`
    );
    void valid;
  }

  lines.push("");

  // ── Win Conditions ───────────────────────────────────────────────────────
  lines.push("## Win Conditions");
  lines.push("");
  lines.push("| Condition | Count | % |");
  lines.push("|-----------|-------|---|");

  // Aggregate win conditions across matchups
  const winConditionTotals: Record<string, number> = {};
  for (const mr of r.matchupResults) {
    for (const [reason, count] of Object.entries(mr.winReasons)) {
      winConditionTotals[reason] = (winConditionTotals[reason] ?? 0) + count;
    }
  }

  const totalWins = Object.values(winConditionTotals).reduce((a, b) => a + b, 0);
  const sortedConditions = Object.entries(winConditionTotals).sort((a, b) => b[1] - a[1]);

  for (const [condition, count] of sortedConditions) {
    const flag70 = totalWins > 0 && count / totalWins > 0.7 ? " ⚠️ dominant" : "";
    lines.push(`| ${condition} | ${count} | ${pct(count, r.totalGames)}${flag70} |`);
  }

  lines.push("");

  // ── Card Play Frequency ──────────────────────────────────────────────────
  lines.push("## Card Play Frequency");
  lines.push("");
  lines.push("### Most Played (top 10)");
  lines.push("");
  lines.push("| Card | Play Count |");
  lines.push("|------|-----------|");

  const sortedCards = Object.entries(r.globalCardPlayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  for (const [cardId, count] of sortedCards) {
    lines.push(`| \`${cardId}\` | ${count} |`);
  }

  lines.push("");

  if (r.globalStats.neverPlayedCards.length > 0) {
    lines.push("### Never Played (0 plays across 100 games)");
    lines.push("");
    lines.push(
      "Cards never played may be too expensive, require impossible conditions, or have bugs."
    );
    lines.push("");
    for (const cardId of r.globalStats.neverPlayedCards) {
      lines.push(`- \`${cardId}\``);
    }
    lines.push("");
  } else {
    lines.push("### Never Played");
    lines.push("");
    lines.push("All deck cards were played at least once.");
    lines.push("");
  }

  // ── Balance Flags ────────────────────────────────────────────────────────
  lines.push("## Balance Flags");
  lines.push("");

  const flags: string[] = [];

  for (const mr of r.matchupResults) {
    const n = mr.gamesPlayed;
    if (n > 0) {
      if (mr.player1Wins / n > 0.65) {
        flags.push(
          `⚠️ **${mr.player1Deck}** wins ${pct(mr.player1Wins, n)} vs ${mr.player2Deck} — potential imbalance`
        );
      }
      if (mr.player2Wins / n > 0.65) {
        flags.push(
          `⚠️ **${mr.player2Deck}** wins ${pct(mr.player2Wins, n)} vs ${mr.player1Deck} — potential imbalance`
        );
      }
    }
  }

  for (const [condition, count] of sortedConditions) {
    if (totalWins > 0 && count / totalWins > 0.7) {
      flags.push(
        `⚠️ Win condition **${condition}** dominates (${pct(count, totalWins)} of all decisive games)`
      );
    }
  }

  // Cards played in < 5% of games
  const threshold = r.totalGames * 0.05;
  for (const [cardId, count] of Object.entries(r.globalCardPlayCounts)) {
    if (count > 0 && count < threshold) {
      flags.push(`⚠️ Card \`${cardId}\` played in only ${count} games (${pct(count, r.totalGames)})`);
    }
  }

  if (r.crashes.length > 0) {
    for (const c of r.crashes) {
      flags.push(`🐛 Crash on seed ${c.seed}: \`${c.error.substring(0, 120)}\``);
    }
  }

  if (flags.length === 0) {
    lines.push("No balance flags raised.");
  } else {
    for (const flag of flags) {
      lines.push(`- ${flag}`);
    }
  }

  lines.push("");

  // ── Aggregate Stats ──────────────────────────────────────────────────────
  lines.push("## Aggregate Stats");
  lines.push("");
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Avg game length (turns) | ${r.globalStats.avgGameLength.toFixed(1)} |`);
  lines.push(`| Avg MP gained / turn | ${r.globalStats.avgMPGainedPerTurn.toFixed(1)} |`);
  lines.push(`| Avg quests per game | ${r.globalStats.avgQuestsPerGame.toFixed(1)} |`);
  lines.push(`| Avg piecies per game | ${r.globalStats.avgPieciesPerGame.toFixed(1)} |`);
  lines.push(`| Most played card | \`${r.globalStats.mostPlayedCard}\` |`);
  lines.push(`| Most common win condition | ${r.globalStats.mostCommonWinCondition} |`);
  lines.push("");

  // ── Recommended Follow-up ────────────────────────────────────────────────
  lines.push("## Recommended Follow-up");
  lines.push("");
  lines.push(
    "Based on simulation results:"
  );
  lines.push("");

  if (r.crashes.length > 0) {
    lines.push(`- Fix ${r.crashes.length} crash(es) found during simulation.`);
  }
  if (r.timeouts.length > r.totalGames * 0.2) {
    lines.push(
      `- High timeout rate (${pct(r.timeouts.length, r.totalGames)}): consider adding more aggressive win conditions or reducing card costs to speed up games.`
    );
  }
  if (r.globalStats.neverPlayedCards.length > 0) {
    lines.push(
      `- Investigate ${r.globalStats.neverPlayedCards.length} never-played card(s): check cost gating, requirement conditions, and whether they belong in starter decks.`
    );
  }
  if (flags.some((f) => f.startsWith("⚠️") && f.includes("wins"))) {
    lines.push("- Review deck balance for matchups flagged as one-sided (>65% win rate).");
  }
  if (flags.some((f) => f.includes("dominates"))) {
    lines.push(
      "- The dominant win condition suggests that strategy is too powerful relative to alternatives."
    );
  }
  lines.push(
    "- Review cards played in very few games — they may need cost reductions or requirement relaxation."
  );
  lines.push("");

  return lines.join("\n");
}

const markdown = buildMarkdown(report);
const mdPath = join(docsDir, "simulation-report.md");
writeFileSync(mdPath, markdown, "utf-8");
console.log(`Markdown written to ${mdPath}`);

// Print summary to console
console.log("\n=== Summary ===");
for (const mr of report.matchupResults) {
  console.log(
    `${mr.player1Deck} vs ${mr.player2Deck}: P1=${mr.player1Wins} P2=${mr.player2Wins} T=${mr.timeouts} avgTurns=${mr.avgTurns.toFixed(1)}`
  );
}
console.log(`\nMost common win condition: ${report.globalStats.mostCommonWinCondition}`);
console.log(`Most played card: ${report.globalStats.mostPlayedCard}`);
if (report.globalStats.neverPlayedCards.length > 0) {
  console.log(`Never played: ${report.globalStats.neverPlayedCards.join(", ")}`);
}
