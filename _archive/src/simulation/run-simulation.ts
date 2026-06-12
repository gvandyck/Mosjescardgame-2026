/**
 * Phase 9 — Simulation Harness (100 games)
 *
 * Runs three matchups (≈33–34 games each) and aggregates results
 * into a SimulationReport.
 */
import { runGame } from "./game-runner.js";
import { PHYSICAL_FORCE, DIGITAL_CONTROL, ARTISTIC_RHYTHM } from "./starter-decks.js";
import type { CardId } from "../types/card-id.js";
import type { DeckConfig } from "./starter-decks.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MatchupResult {
  readonly player1Deck: string;
  readonly player2Deck: string;
  readonly gamesPlayed: number;
  readonly player1Wins: number;
  readonly player2Wins: number;
  readonly timeouts: number;
  readonly avgTurns: number;
  readonly winReasons: Record<string, number>;
}

export interface AggregateStats {
  readonly avgGameLength: number;
  readonly avgMPGainedPerTurn: number;
  readonly avgQuestsPerGame: number;
  readonly avgPieciesPerGame: number;
  readonly mostPlayedCard: CardId;
  readonly leastPlayedCard: CardId;
  readonly neverPlayedCards: ReadonlyArray<CardId>;
  readonly mostCommonWinCondition: string;
}

export interface SimulationReport {
  readonly totalGames: number;
  readonly crashes: ReadonlyArray<{ seed: number; error: string }>;
  readonly timeouts: ReadonlyArray<number>;
  readonly matchupResults: ReadonlyArray<MatchupResult>;
  readonly globalCardPlayCounts: Record<CardId, number>;
  readonly globalStats: AggregateStats;
}

export interface SimulationConfig {
  readonly gamesPerMatchup: number;
  readonly maxTurnsPerGame: number;
}

// ─── Matchup runner ───────────────────────────────────────────────────────────

function runMatchup(
  p1: DeckConfig,
  p2: DeckConfig,
  seedStart: number,
  gameCount: number,
  maxTurns: number
): {
  result: MatchupResult;
  crashes: Array<{ seed: number; error: string }>;
  timeoutSeeds: number[];
  cardPlayCounts: Record<string, number>;
  totalTurns: number;
  totalMPGained: number;
  totalQuests: number;
  totalPiecies: number;
} {
  let player1Wins = 0;
  let player2Wins = 0;
  let timeouts = 0;
  const winReasons: Record<string, number> = {};
  const crashes: Array<{ seed: number; error: string }> = [];
  const timeoutSeeds: number[] = [];
  const cardPlayCounts: Record<string, number> = {};
  let totalTurns = 0;
  let totalMPGained = 0;
  let totalQuests = 0;
  let totalPiecies = 0;

  for (let i = 0; i < gameCount; i++) {
    const seed = seedStart + i;

    const result = runGame({
      seed,
      player1Deck: p1.deck,
      player2Deck: p2.deck,
      player1MosjeIds: [...p1.mosjes],
      player2MosjeIds: [...p2.mosjes],
      maxTurns
    });

    totalTurns += result.totalTurns;

    if (result.crashed && result.crashError !== undefined) {
      crashes.push({ seed, error: result.crashError });
      continue;
    }

    const reason = result.winReason ?? "timeout";
    winReasons[reason] = (winReasons[reason] ?? 0) + 1;

    if (result.winnerId === null || reason === "timeout") {
      timeouts++;
      timeoutSeeds.push(seed);
    } else if (result.winnerId === "player1") {
      player1Wins++;
    } else if (result.winnerId === "player2") {
      player2Wins++;
    }

    // Aggregate card play counts
    for (const [cardId, count] of Object.entries(result.stats.cardPlayCounts)) {
      cardPlayCounts[cardId] = (cardPlayCounts[cardId] ?? 0) + count;
    }

    // Aggregate MP gained
    for (const mpGained of Object.values(result.stats.mpGainedByPlayer)) {
      totalMPGained += mpGained;
    }

    // Aggregate quests
    for (const qc of Object.values(result.stats.questsCompletedByPlayer)) {
      totalQuests += qc;
    }

    // Aggregate piecies
    for (const pc of Object.values(result.stats.pieciesPlayedByPlayer)) {
      totalPiecies += pc;
    }
  }

  const validGames = gameCount - crashes.length;
  const avgTurns = validGames > 0 ? totalTurns / validGames : 0;

  return {
    result: {
      player1Deck: p1.name,
      player2Deck: p2.name,
      gamesPlayed: gameCount,
      player1Wins,
      player2Wins,
      timeouts,
      avgTurns,
      winReasons
    },
    crashes,
    timeoutSeeds,
    cardPlayCounts,
    totalTurns,
    totalMPGained,
    totalQuests,
    totalPiecies
  };
}

// ─── Aggregate stats ──────────────────────────────────────────────────────────

function computeAggregateStats(
  totalGames: number,
  totalTurns: number,
  totalMPGained: number,
  totalQuests: number,
  totalPiecies: number,
  globalCardPlayCounts: Record<string, number>,
  allDeckCards: ReadonlyArray<CardId>,
  winReasonTotals: Record<string, number>
): AggregateStats {
  const avgGameLength = totalGames > 0 ? totalTurns / totalGames : 0;
  const avgMPGainedPerTurn = totalTurns > 0 ? totalMPGained / totalTurns : 0;
  const avgQuestsPerGame = totalGames > 0 ? totalQuests / totalGames : 0;
  const avgPieciesPerGame = totalGames > 0 ? totalPiecies / totalGames : 0;

  // Most/least played cards
  const entries = Object.entries(globalCardPlayCounts).filter(([, c]) => c > 0);
  entries.sort((a, b) => b[1] - a[1]);

  const mostPlayedCard = (entries[0]?.[0] ?? "none") as CardId;
  const leastPlayedCard = (entries[entries.length - 1]?.[0] ?? "none") as CardId;

  // Never played cards: all unique deck cards minus those with any plays
  const uniqueDeckCards = [...new Set(allDeckCards)];
  const neverPlayedCards = uniqueDeckCards.filter(
    (cardId) => (globalCardPlayCounts[cardId as string] ?? 0) === 0
  );

  // Most common win condition
  const winEntries = Object.entries(winReasonTotals).sort((a, b) => b[1] - a[1]);
  const mostCommonWinCondition = winEntries[0]?.[0] ?? "none";

  return {
    avgGameLength,
    avgMPGainedPerTurn,
    avgQuestsPerGame,
    avgPieciesPerGame,
    mostPlayedCard,
    leastPlayedCard,
    neverPlayedCards,
    mostCommonWinCondition
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function runSimulation(config: SimulationConfig): SimulationReport {
  const { gamesPerMatchup, maxTurnsPerGame } = config;

  // Matchup 1: Physical Force vs Digital Control  (seeds 1..gamesPerMatchup)
  // Matchup 2: Digital Control vs Artistic Rhythm (seeds gamesPerMatchup+1..2*gamesPerMatchup)
  // Matchup 3: Artistic Rhythm vs Physical Force  (seeds 2*gamesPerMatchup+1..3*gamesPerMatchup+extra)

  const m1SeedStart = 1;
  const m2SeedStart = m1SeedStart + gamesPerMatchup;
  const m3SeedStart = m2SeedStart + gamesPerMatchup;

  console.log(`Running matchup 1: ${PHYSICAL_FORCE.name} vs ${DIGITAL_CONTROL.name} (${gamesPerMatchup} games)...`);
  const m1 = runMatchup(PHYSICAL_FORCE, DIGITAL_CONTROL, m1SeedStart, gamesPerMatchup, maxTurnsPerGame);

  console.log(`Running matchup 2: ${DIGITAL_CONTROL.name} vs ${ARTISTIC_RHYTHM.name} (${gamesPerMatchup} games)...`);
  const m2 = runMatchup(DIGITAL_CONTROL, ARTISTIC_RHYTHM, m2SeedStart, gamesPerMatchup, maxTurnsPerGame);

  // Matchup 3 gets 34 games if gamesPerMatchup is 33 to reach total ~100
  const m3Count = 100 - gamesPerMatchup * 2;
  console.log(`Running matchup 3: ${ARTISTIC_RHYTHM.name} vs ${PHYSICAL_FORCE.name} (${m3Count} games)...`);
  const m3 = runMatchup(ARTISTIC_RHYTHM, PHYSICAL_FORCE, m3SeedStart, m3Count, maxTurnsPerGame);

  // Merge global card play counts
  const globalCardPlayCounts: Record<string, number> = {};
  for (const counts of [m1.cardPlayCounts, m2.cardPlayCounts, m3.cardPlayCounts]) {
    for (const [cardId, count] of Object.entries(counts)) {
      globalCardPlayCounts[cardId] = (globalCardPlayCounts[cardId] ?? 0) + count;
    }
  }

  // Merge win reasons for aggregate stats
  const winReasonTotals: Record<string, number> = {};
  for (const mr of [m1.result, m2.result, m3.result]) {
    for (const [reason, count] of Object.entries(mr.winReasons)) {
      winReasonTotals[reason] = (winReasonTotals[reason] ?? 0) + count;
    }
  }

  // All deck cards (for never-played computation)
  const allDeckCards: CardId[] = [
    ...PHYSICAL_FORCE.deck,
    ...DIGITAL_CONTROL.deck,
    ...ARTISTIC_RHYTHM.deck
  ];

  const totalGames = gamesPerMatchup * 2 + m3Count;
  const totalTurns = m1.totalTurns + m2.totalTurns + m3.totalTurns;
  const totalMPGained = m1.totalMPGained + m2.totalMPGained + m3.totalMPGained;
  const totalQuests = m1.totalQuests + m2.totalQuests + m3.totalQuests;
  const totalPiecies = m1.totalPiecies + m2.totalPiecies + m3.totalPiecies;

  const globalStats = computeAggregateStats(
    totalGames,
    totalTurns,
    totalMPGained,
    totalQuests,
    totalPiecies,
    globalCardPlayCounts,
    allDeckCards,
    winReasonTotals
  );

  const allCrashes = [...m1.crashes, ...m2.crashes, ...m3.crashes];
  const allTimeoutSeeds = [...m1.timeoutSeeds, ...m2.timeoutSeeds, ...m3.timeoutSeeds];

  return {
    totalGames,
    crashes: allCrashes,
    timeouts: allTimeoutSeeds,
    matchupResults: [m1.result, m2.result, m3.result],
    globalCardPlayCounts: globalCardPlayCounts as Record<CardId, number>,
    globalStats
  };
}
