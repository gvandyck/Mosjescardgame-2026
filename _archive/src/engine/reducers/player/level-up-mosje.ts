import { appendEvent } from "../../append-event.js";
import { applyVictoryCheck } from "../../apply-victory-check.js";
import type { GameState } from "../../../types/game-state.js";
import type { LevelUpMosjeAction } from "../../../types/player-reducer-actions.js";

export function levelUpMosje(state: GameState, action: LevelUpMosjeAction): GameState {
  const playerIndex = state.players.findIndex((player) => player.id === action.target.playerId);
  if (playerIndex < 0) return state;

  const player = state.players[playerIndex];
  const mosjeIndex = player.mosjes.findIndex((mosje) => mosje.instanceId === action.target.instanceId);
  if (mosjeIndex < 0) return state;

  const mosje = player.mosjes[mosjeIndex];
  if (mosje.mp < 100 || mosje.level === 3) return state;

  const newLevel = (mosje.level + 1) as 2 | 3;
  const updatedMosjes = player.mosjes.map((item, index) => {
    if (index !== mosjeIndex) return item;
    return {
      ...item,
      level: newLevel,
      mp: 0
    };
  });

  const updatedPlayer = { ...player, mosjes: updatedMosjes };
  const updatedPlayers = state.players.map((item, index) => (index === playerIndex ? updatedPlayer : item));
  const nextState = { ...state, players: updatedPlayers };

  const withEvent = appendEvent(nextState, {
    type: "mosje_leveled_up",
    target: action.target,
    newLevel
  });

  return applyVictoryCheck(withEvent);
}
