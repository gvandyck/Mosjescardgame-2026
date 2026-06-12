import { appendEvent } from "../../append-event.js";
import { applyVictoryCheck } from "../../apply-victory-check.js";
import type { GameState } from "../../../types/game-state.js";
import type { LoseMPAction } from "../../../types/player-reducer-actions.js";

export function loseMP(state: GameState, action: LoseMPAction): GameState {
  const playerIndex = state.players.findIndex((player) => player.id === action.target.playerId);
  if (playerIndex < 0) return state;

  const player = state.players[playerIndex];
  const mosjeIndex = player.mosjes.findIndex((mosje) => mosje.instanceId === action.target.instanceId);
  if (mosjeIndex < 0) return state;

  const mosje = player.mosjes[mosjeIndex];
  if (mosje.flags.in_welloe === true) return state;

  const isCostPayment = action.source.kind === "cost";
  const nextMp = mosje.mp - action.amount;
  // Defeat only when reduced BELOW 0. A Mosje at exactly 0 survives; it dies
  // only when further damage would push it negative. Matches the imperative
  // engine + ruling phase0-rulings.md:118 (never hold negative MP).
  const isDefeated = !isCostPayment && nextMp < 0;

  const nextFlags = { ...mosje.flags };
  if (isDefeated) {
    nextFlags.in_welloe = true;
    delete nextFlags.cannot_complete_quests;
  } else if (nextMp < 0) {
    nextFlags.cannot_complete_quests = true;
  } else {
    delete nextFlags.cannot_complete_quests;
  }

  const updatedMosjes = player.mosjes.map((item, index) => {
    if (index !== mosjeIndex) return item;
    return { ...item, mp: nextMp, flags: nextFlags };
  });

  const updatedPlayer = {
    ...player,
    mosjes: updatedMosjes,
    ...(isDefeated ? { discard: [...player.discard, mosje.cardId] } : {})
  };

  const updatedPlayers = state.players.map((item, index) => {
    if (index !== playerIndex) return item;
    return {
      ...updatedPlayer,
      totalDamageTaken: isCostPayment
        ? updatedPlayer.totalDamageTaken
        : updatedPlayer.totalDamageTaken + action.amount
    };
  });

  const nextState = { ...state, players: updatedPlayers };

  const withMpEvent = appendEvent(nextState, {
    type: "mp_lost",
    target: action.target,
    amount: action.amount,
    source: action.source
  });

  const withAllEvents = isDefeated
    ? appendEvent(withMpEvent, { type: "mosje_defeated", target: action.target })
    : withMpEvent;

  return applyVictoryCheck(withAllEvents);
}
