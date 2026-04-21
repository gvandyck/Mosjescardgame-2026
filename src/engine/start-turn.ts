import { appendEvent } from "./append-event.js";
import { applyVictoryCheck } from "./apply-victory-check.js";
import type { GameState } from "../types/game-state.js";

function clearTurnScopedMosjeFlags(state: GameState): GameState {
  return {
    ...state,
    players: state.players.map((player) => {
      if (player.id !== state.currentPlayerId) return player;
      return {
        ...player,
        mosjes: player.mosjes.map((mosje) => {
          const nextFlags = { ...mosje.flags };
          delete nextFlags["ability_used_this_turn"];
          return { ...mosje, flags: nextFlags };
        })
      };
    })
  };
}

export function startTurn(state: GameState): GameState {
  const updatedPlayers = state.players.map((player) => ({
    ...player,
    piecieSlots: player.piecieSlots.map((slot) => {
      if (slot.cardId === null || slot.faceUp) return slot;
      return { ...slot, turnsSincePlaced: slot.turnsSincePlaced + 1 };
    })
  }));

  let nextState: GameState = clearTurnScopedMosjeFlags({
    ...state,
    players: updatedPlayers,
    currentPhase: "draw",
    currentTurnStartCount: state.turnCount
  });

  nextState = appendEvent(nextState, {
    type: "turn_started",
    turn: state.turnCount,
    playerId: state.currentPlayerId
  });

  if (state.currentPhase !== "draw") {
    nextState = appendEvent(nextState, {
      type: "phase_changed",
      from: state.currentPhase,
      to: "draw"
    });
  }

  return applyVictoryCheck(nextState);
}
