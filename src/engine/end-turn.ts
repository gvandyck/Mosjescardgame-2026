import { appendEvent } from "./append-event.js";
import type { GameState } from "../types/game-state.js";

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

  return appendEvent(nextState, {
    type: "turn_ended",
    turn: state.turnCount,
    playerId: state.currentPlayerId
  });
}
