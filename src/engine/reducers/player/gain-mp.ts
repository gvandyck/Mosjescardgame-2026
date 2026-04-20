import { appendEvent } from "../../append-event.js";
import type { GameState } from "../../../types/game-state.js";
import type { GainMPAction } from "../../../types/player-reducer-actions.js";

export function gainMP(state: GameState, action: GainMPAction): GameState {
  const playerIndex = state.players.findIndex((player) => player.id === action.target.playerId);
  if (playerIndex < 0) return state;

  const player = state.players[playerIndex];
  const mosjeIndex = player.mosjes.findIndex((mosje) => mosje.instanceId === action.target.instanceId);
  if (mosjeIndex < 0) return state;

  const mosje = player.mosjes[mosjeIndex];
  let nextMp = mosje.mp + action.amount;
  let nextLevel = mosje.level;
  const levelEvents: Array<2 | 3> = [];

  while (nextMp >= 100 && nextLevel < 3) {
    nextLevel = (nextLevel + 1) as 2 | 3;
    nextMp = 0;
    levelEvents.push(nextLevel);
  }

  const nextFlags = { ...mosje.flags };
  if (nextMp >= 0) {
    delete nextFlags.cannot_complete_quests;
  }

  const updatedMosjes = player.mosjes.map((item, index) => {
    if (index !== mosjeIndex) return item;
    return {
      ...item,
      mp: nextMp,
      level: nextLevel,
      flags: nextFlags
    };
  });

  const updatedPlayer = { ...player, mosjes: updatedMosjes };
  const updatedPlayers = state.players.map((item, index) => (index === playerIndex ? updatedPlayer : item));

  let nextState: GameState = { ...state, players: updatedPlayers };
  nextState = appendEvent(nextState, {
    type: "mp_gained",
    target: action.target,
    amount: action.amount,
    source: action.source
  });

  for (const newLevel of levelEvents) {
    nextState = appendEvent(nextState, {
      type: "mosje_leveled_up",
      target: action.target,
      newLevel
    });
  }

  return nextState;
}
