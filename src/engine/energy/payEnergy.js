// payEnergy.js — pay Energy from a player's pool.
// Mutates state.players[playerId].energy in place (callers pass an already-cloned state).
// On failure the state is untouched. Never leaves Energy below 0.
import { canPay } from './canPay.js';

export function payEnergy(state, playerId, amount) {
  const player = state?.players?.[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };
  if (!Number.isInteger(amount) || amount < 0) {
    return { state, success: false, error: 'Invalid cost' };
  }
  if (!canPay(player, amount)) {
    return { state, success: false, error: 'Not enough Energy' };
  }
  player.energy -= amount;
  console.log(`[ENERGY] ${playerId} pays ${amount} (left ${player.energy})`);
  return { state, success: true };
}
