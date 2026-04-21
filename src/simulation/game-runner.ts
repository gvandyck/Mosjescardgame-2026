/**
 * Phase 9 — Game Runner
 *
 * Runs a single game between two AI players, returning a GameResult with stats.
 * Stats are collected by scanning the eventLog after the game ends.
 */
import { createRng } from "../utils/rng.js";
import { createGame } from "../engine/create-game.js";
import { applyVictoryCheck } from "../engine/apply-victory-check.js";
import { freezeRegistry } from "../cards/registry/index.js";
import { aiTakeTurn } from "./ai-player.js";
import type { GameState } from "../types/game-state.js";
import type { GameEvent } from "../types/events.js";
import type { CardId } from "../types/card-id.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GameStats {
  readonly mpGainedByPlayer: Record<string, number>;
  readonly mpLostByPlayer: Record<string, number>;
  readonly questsCompletedByPlayer: Record<string, number>;
  readonly questsFailedByPlayer: Record<string, number>;
  readonly pieciesPlayedByPlayer: Record<string, number>;
  readonly synergiesFiredByPlayer: Record<string, number>;
  readonly snellePieciesPlayedByPlayer: Record<string, number>;
  readonly cardPlayCounts: Record<CardId, number>;
  readonly placesEntered: ReadonlyArray<CardId>;
  readonly levelUps: ReadonlyArray<{ playerId: string; newLevel: 2 | 3; turn: number }>;
  readonly winCondition:
    | "level_3"
    | "knockout"
    | "quest_master"
    | "momentum_domination"
    | "timeout"
    | null;
}

export interface GameResult {
  readonly seed: number;
  readonly winnerId: string | null;
  readonly winReason: string | null;
  readonly totalTurns: number;
  readonly finalState: GameState;
  readonly eventLog: ReadonlyArray<GameEvent>;
  readonly crashed: boolean;
  readonly crashError?: string;
  readonly crashStateSnapshot?: string;
  readonly stats: GameStats;
}

export interface RunGameConfig {
  readonly seed: number;
  readonly player1Deck: ReadonlyArray<CardId>;
  readonly player2Deck: ReadonlyArray<CardId>;
  readonly player1MosjeIds: ReadonlyArray<{ cardId: CardId; startMP: number }>;
  readonly player2MosjeIds: ReadonlyArray<{ cardId: CardId; startMP: number }>;
  readonly maxTurns?: number;
}

// ─── Stats collector ──────────────────────────────────────────────────────────

function collectStats(
  eventLog: ReadonlyArray<GameEvent>,
  playerIds: ReadonlyArray<string>,
  winReason: string | null
): GameStats {
  const mpGainedByPlayer: Record<string, number> = {};
  const mpLostByPlayer: Record<string, number> = {};
  const questsCompletedByPlayer: Record<string, number> = {};
  const questsFailedByPlayer: Record<string, number> = {};
  const pieciesPlayedByPlayer: Record<string, number> = {};
  const synergiesFiredByPlayer: Record<string, number> = {};
  const snellePieciesPlayedByPlayer: Record<string, number> = {};
  const cardPlayCounts: Record<string, number> = {};
  const placesEntered: CardId[] = [];
  const levelUps: Array<{ playerId: string; newLevel: 2 | 3; turn: number }> = [];

  for (const pid of playerIds) {
    mpGainedByPlayer[pid] = 0;
    mpLostByPlayer[pid] = 0;
    questsCompletedByPlayer[pid] = 0;
    questsFailedByPlayer[pid] = 0;
    pieciesPlayedByPlayer[pid] = 0;
    synergiesFiredByPlayer[pid] = 0;
    snellePieciesPlayedByPlayer[pid] = 0;
  }

  for (const event of eventLog) {
    switch (event.type) {
      case "mp_gained":
        if (event.target.playerId in mpGainedByPlayer) {
          mpGainedByPlayer[event.target.playerId] =
            (mpGainedByPlayer[event.target.playerId] ?? 0) + event.amount;
        }
        break;
      case "mp_lost":
        if (event.target.playerId in mpLostByPlayer) {
          mpLostByPlayer[event.target.playerId] =
            (mpLostByPlayer[event.target.playerId] ?? 0) + event.amount;
        }
        break;
      case "quest_completed":
        if (event.playerId in questsCompletedByPlayer) {
          questsCompletedByPlayer[event.playerId] =
            (questsCompletedByPlayer[event.playerId] ?? 0) + 1;
        }
        break;
      case "quest_failed":
        if (event.playerId in questsFailedByPlayer) {
          questsFailedByPlayer[event.playerId] =
            (questsFailedByPlayer[event.playerId] ?? 0) + 1;
        }
        break;
      case "piecie_activated": {
        if (event.playerId in pieciesPlayedByPlayer) {
          pieciesPlayedByPlayer[event.playerId] =
            (pieciesPlayedByPlayer[event.playerId] ?? 0) + 1;
        }
        break;
      }
      case "card_resolved": {
        if (event.outcome === "success") {
          const cid = event.cardId as string;
          cardPlayCounts[cid] = (cardPlayCounts[cid] ?? 0) + 1;
        }
        break;
      }
      case "place_entered":
        placesEntered.push(event.cardId);
        break;
      case "mosje_leveled_up": {
        const turn = 0; // We don't track turn precisely here
        levelUps.push({
          playerId: event.target.playerId,
          newLevel: event.newLevel,
          turn
        });
        break;
      }
      default:
        break;
    }
  }

  // Determine winCondition
  let winCondition: GameStats["winCondition"] = null;
  if (winReason === "level_3") winCondition = "level_3";
  else if (winReason === "knockout") winCondition = "knockout";
  else if (winReason === "quest_master") winCondition = "quest_master";
  else if (winReason === "momentum_domination") winCondition = "momentum_domination";
  else if (winReason === "timeout") winCondition = "timeout";

  return {
    mpGainedByPlayer,
    mpLostByPlayer,
    questsCompletedByPlayer,
    questsFailedByPlayer,
    pieciesPlayedByPlayer,
    synergiesFiredByPlayer,
    snellePieciesPlayedByPlayer,
    cardPlayCounts: cardPlayCounts as Record<CardId, number>,
    placesEntered,
    levelUps,
    winCondition
  };
}

// ─── Game runner ──────────────────────────────────────────────────────────────

let registryFrozen = false;

export function runGame(config: RunGameConfig): GameResult {
  const maxTurns = config.maxTurns ?? 60;

  // Freeze registry before first game
  if (!registryFrozen) {
    freezeRegistry();
    registryFrozen = true;
  }

  const playerIds = ["player1", "player2"];
  let state: GameState;

  try {
    state = createGame({
      seed: config.seed,
      players: [
        {
          id: "player1",
          name: "Player 1",
          deck: config.player1Deck,
          mosjes: config.player1MosjeIds.map((m) => ({ cardId: m.cardId, startMP: m.startMP }))
        },
        {
          id: "player2",
          name: "Player 2",
          deck: config.player2Deck,
          mosjes: config.player2MosjeIds.map((m) => ({ cardId: m.cardId, startMP: m.startMP }))
        }
      ]
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const emptyStats = collectStats([], playerIds, null);
    return {
      seed: config.seed,
      winnerId: null,
      winReason: null,
      totalTurns: 0,
      finalState: {} as GameState,
      eventLog: [],
      crashed: true,
      crashError: errorMsg,
      crashStateSnapshot: "{}",
      stats: emptyStats
    };
  }

  // Apply initial victory check (shouldn't find anything yet, but be safe)
  state = applyVictoryCheck(state);

  const rng = createRng(config.seed);

  // Game loop
  while (state.turnCount <= maxTurns) {
    // Check if game is already won before this turn
    const wonEvent = state.eventLog.find((e) => e.type === "game_won");
    if (wonEvent !== undefined && wonEvent.type === "game_won") {
      const stats = collectStats(state.eventLog, playerIds, wonEvent.reason);
      return {
        seed: config.seed,
        winnerId: wonEvent.playerId,
        winReason: wonEvent.reason,
        totalTurns: state.turnCount,
        finalState: state,
        eventLog: state.eventLog,
        crashed: false,
        stats
      };
    }

    const currentPlayerId = state.currentPlayerId;

    try {
      const prevState = state;
      state = aiTakeTurn(state, currentPlayerId, rng);

      // If state didn't change at all (shouldn't happen), break to avoid infinite loop
      if (state === prevState) {
        break;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      let snapshot = "{}";
      try {
        snapshot = JSON.stringify(state);
      } catch {
        snapshot = '{"error":"state_not_serializable"}';
      }

      const stats = collectStats(state.eventLog, playerIds, null);
      return {
        seed: config.seed,
        winnerId: null,
        winReason: null,
        totalTurns: state.turnCount,
        finalState: state,
        eventLog: state.eventLog,
        crashed: true,
        crashError: errorMsg,
        crashStateSnapshot: snapshot,
        stats
      };
    }

    // Check victory after each AI turn
    state = applyVictoryCheck(state);

    const wonAfter = state.eventLog.find((e) => e.type === "game_won");
    if (wonAfter !== undefined && wonAfter.type === "game_won") {
      const stats = collectStats(state.eventLog, playerIds, wonAfter.reason);
      return {
        seed: config.seed,
        winnerId: wonAfter.playerId,
        winReason: wonAfter.reason,
        totalTurns: state.turnCount,
        finalState: state,
        eventLog: state.eventLog,
        crashed: false,
        stats
      };
    }
  }

  // Timeout
  const stats = collectStats(state.eventLog, playerIds, "timeout");
  return {
    seed: config.seed,
    winnerId: null,
    winReason: "timeout",
    totalTurns: state.turnCount,
    finalState: state,
    eventLog: state.eventLog,
    crashed: false,
    stats
  };
}
