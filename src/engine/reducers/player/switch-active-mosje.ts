import type { GameState } from "../../../types/game-state.js";
import type { SwitchActiveMosjeAction } from "../../../types/player-reducer-actions.js";

export function switchActiveMosje(state: GameState, action: SwitchActiveMosjeAction): GameState {
  const playerIndex = state.players.findIndex((player) => player.id === action.playerId);
  if (playerIndex < 0) return state;

  const player = state.players[playerIndex];
  const nextActiveMosjeIndex: 0 | 1 = player.activeMosjeIndex === 0 ? 1 : 0;
  const updatedPlayer = {
    ...player,
    activeMosjeIndex: nextActiveMosjeIndex
  };

  const updatedPlayers = state.players.map((item, index) => (index === playerIndex ? updatedPlayer : item));
  return { ...state, players: updatedPlayers };
}
