// gainEnergy.js — add Energy to a player's pool, hard-capped at ENERGY_MAX.
// Mutates in place (callers pass an already-cloned state). Ignores invalid amounts.
import { ENERGY_MAX, ENERGY_PER_TURN } from './energyRules.js';

export function gainEnergy(state, playerId, amount = ENERGY_PER_TURN) {
  const player = state?.players?.[playerId];
  if (!player) return state;
  if (!Number.isInteger(amount) || amount < 0) return state;
  const current = Number.isInteger(player.energy) ? player.energy : 0;
  player.energy = Math.min(ENERGY_MAX, current + amount);
  console.log(`[ENERGY] ${playerId} +${amount} (now ${player.energy})`);
  return state;
}
