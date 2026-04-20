import type { GameState } from "../types/game-state.js";

export function checkVictory(state: GameState): { winnerId: string | null; reason: string | null } {
  for (const player of state.players) {
    if (player.mosjes.some((mosje) => mosje.level >= 3)) {
      return { winnerId: player.id, reason: "level_3" };
    }
  }

  for (const player of state.players) {
    const opponents = state.players.filter((candidate) => candidate.id !== player.id);
    if (
      opponents.length > 0 &&
      opponents.every((opponent) =>
        opponent.mosjes.every((mosje) => opponent.welloePile.includes(mosje.cardId))
      )
    ) {
      return { winnerId: player.id, reason: "knockout" };
    }
  }

  for (const player of state.players) {
    const questsCompleted = player.flags.quests_completed_total;
    if (typeof questsCompleted === "number" && questsCompleted >= 7) {
      return { winnerId: player.id, reason: "quest_master" };
    }
  }

  if (state.currentPhase === "draw") {
    for (const player of state.players) {
      const combinedMp = player.mosjes.reduce((sum, mosje) => sum + mosje.mp, 0);
      if (combinedMp >= 250) {
        return { winnerId: player.id, reason: "momentum_domination" };
      }
    }
  }

  return { winnerId: null, reason: null };
}
