// payEnergy.js — pay Energy from a player's pool.
// Mutates state.players[playerId].energy in place (callers pass an already-cloned state).
// On failure the state is untouched. Never leaves Energy below 0.
import { canPay } from './canPay.js';
import { delluftFee } from './delluftFee.js';

export function payEnergy(state, playerId, amount) {
  const player = state?.players?.[playerId];
  if (!player) return { state, success: false, error: 'Player not found' };
  if (!Number.isInteger(amount) || amount < 0) {
    return { state, success: false, error: 'Invalid cost' };
  }
  // Delluft parking fee: first payment on the payer's own turn costs extra; refused whole if it can't be covered.
  const fee = delluftFee(state, playerId, amount);
  if (!canPay(player, amount + fee)) {
    return { state, success: false, error: 'Not enough Energy' };
  }
  if (fee > 0) player.delluftFeeTurn = state.turnNumber ?? 0;
  player.energy -= amount + fee;
  console.log(`[ENERGY] ${playerId} pays ${amount} (left ${player.energy})`);
  return { state, success: true };
}
