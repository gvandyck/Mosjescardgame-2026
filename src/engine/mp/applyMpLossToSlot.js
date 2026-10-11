// applyMpLossToSlot — THE slot-level MP loss funnel (pipeline -> subtract -> track -> getemt).
// Mutates the passed (already cloned) state and slot. Returns { final, getemt }.
import { LOSS_STEPS } from './lossSteps.js';
import { resolveMpLoss } from './resolveMpLoss.js';
import { applyGetemt } from './applyGetemt.js';
import { isFresh } from '../fresh/isFresh.js';
import { isOpponentSourced } from '../fresh/isOpponentSourced.js';

export function applyMpLossToSlot({ state, playerId, slot, amount, source, byPlayerId = null }) {
  if (isFresh(slot) && isOpponentSourced(state, playerId, byPlayerId)) {
    console.log(`[MP] 🛡️ Fresh: ${slot.name} — ${amount} MP loss (${source}) fizzled`);
    return { final: 0, getemt: null };
  }
  const slotIndex = state.players[playerId].activeSlots.indexOf(slot);
  const ctx = { state, playerId, slot, slotIndex, amount, source, placeId: state.activePlace };
  for (const step of LOSS_STEPS.beforeLoss) step(ctx);
  const final = resolveMpLoss(ctx);
  if (final <= 0) return { final: 0, getemt: null };

  slot.mp -= final;
  const player = state.players[playerId];
  player.totalDamageTaken = (player.totalDamageTaken || 0) + final;
  slot.mpLostThisTurn = (slot.mpLostThisTurn || 0) + final;

  let getemt = null;
  if (slot.mp <= 0) getemt = applyGetemt(slot);
  slot.mp = Math.max(0, slot.mp);
  return { final, getemt };
}
