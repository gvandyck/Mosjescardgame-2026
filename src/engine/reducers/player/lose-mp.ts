import { appendEvent } from "../../append-event.js";
import type { GameState } from "../../../types/game-state.js";
import type { LoseMPAction } from "../../../types/player-reducer-actions.js";

export function loseMP(state: GameState, action: LoseMPAction): GameState {
  const playerIndex = state.players.findIndex((player) => player.id === action.target.playerId);
  if (playerIndex < 0) return state;

  const player = state.players[playerIndex];
  const mosjeIndex = player.mosjes.findIndex((mosje) => mosje.instanceId === action.target.instanceId);
  if (mosjeIndex < 0) return state;

  const mosje = player.mosjes[mosjeIndex];
  const nextMp = mosje.mp - action.amount;
  const nextFlags = { ...mosje.flags };

  if (nextMp < 0) {
    nextFlags.cannot_complete_quests = true;
  } else {
    delete nextFlags.cannot_complete_quests;
  }

  const updatedMosjes = player.mosjes.map((item, index) => {
    if (index !== mosjeIndex) return item;
    return {
      ...item,
      mp: nextMp,
      flags: nextFlags
    };
  });

  const updatedPlayer = { ...player, mosjes: updatedMosjes };
  const updatedPlayers = state.players.map((item, index) => (index === playerIndex ? updatedPlayer : item));
  const nextState = { ...state, players: updatedPlayers };

  return appendEvent(nextState, {
    type: "mp_lost",
    target: action.target,
    amount: action.amount,
    source: action.source
  });
}
