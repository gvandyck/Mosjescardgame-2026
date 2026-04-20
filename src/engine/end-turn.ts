import { appendEvent } from "./append-event.js";
import { clearExpiredBuffs } from "../effects/buffs/clear-expired-buffs.js";
import { loseMP } from "../effects/mp/lose-mp.js";
import { createRng } from "../utils/rng.js";
import type { GameState } from "../types/game-state.js";

function applyEndOfTurnMPLossBuffs(state: GameState): GameState {
  let next = state;

  for (const player of next.players) {
    for (const mosje of player.mosjes) {
      const endTurnLossBuff = mosje.flags["buff:end_of_turn_mp_loss"] as
        | { readonly data?: { readonly amount?: number } }
        | undefined;
      const amount = Number(endTurnLossBuff?.data?.amount ?? 0);
      if (amount <= 0) continue;

      next = loseMP(
        next,
        {
          target: { playerId: player.id, instanceId: mosje.instanceId },
          amount,
          isCostPayment: false
        },
        {
          source: { kind: "ability" },
          actingPlayerId: state.currentPlayerId,
          rng: createRng(state.rngSeed),
          turnCount: state.turnCount
        }
      );
    }
  }

  return next;
}

export function endTurn(state: GameState): GameState {
  const currentPlayerIndex = state.players.findIndex((player) => player.id === state.currentPlayerId);
  if (currentPlayerIndex < 0) return state;

  const updatedPlayers = state.players.map((player) => ({
    ...player,
    flags: Object.fromEntries(
      Object.entries(player.flags)
        .map(([key, value]) => {
          if (typeof value !== "number") return [key, value] as const;
          return [key, value - 1] as const;
        })
        .filter(([, value]) => typeof value !== "number" || value > 0)
    ),
    mosjes: player.mosjes.map((mosje) => ({
      ...mosje,
      flags: Object.fromEntries(
        Object.entries(mosje.flags)
          .map(([key, value]) => {
            if (typeof value !== "number") return [key, value] as const;
            return [key, value - 1] as const;
          })
          .filter(([, value]) => typeof value !== "number" || value > 0)
      )
    }))
  }));

  const nextPlayerIndex = (currentPlayerIndex + 1) % state.players.length;
  const nextPlayerId = state.players[nextPlayerIndex].id;

  const nextState: GameState = {
    ...state,
    players: updatedPlayers,
    currentPlayerId: nextPlayerId,
    turnCount: state.turnCount + 1
  };

  const withTurnEnd = appendEvent(nextState, {
    type: "turn_ended",
    turn: state.turnCount,
    playerId: state.currentPlayerId
  });

  const withEndTurnBuffs = applyEndOfTurnMPLossBuffs(withTurnEnd);

  return clearExpiredBuffs(
    withEndTurnBuffs,
    {},
    {
      source: { kind: "ability" },
      actingPlayerId: state.currentPlayerId,
      rng: createRng(state.rngSeed),
      turnCount: nextState.turnCount
    }
  );
}
