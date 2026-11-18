// applyMpLossToSlot — THE slot-level MP loss funnel (pipeline -> subtract -> track -> getemt).
// Mutates the passed (already cloned) state and slot. Returns { final, getemt }.
import { LOSS_STEPS } from './lossSteps.js';
import { resolveMpLoss } from './resolveMpLoss.js';
import { applyGetemt } from './applyGetemt.js';
import { takeReactionMod } from '../reactions/takeReactionMod.js';
import { isFresh } from '../fresh/isFresh.js';
import { isOpponentSourced } from '../fresh/isOpponentSourced.js';
import { runKeywordHook } from '../keywords/runKeywordHook.js';
import { getTimedTotal } from '../durations/getTimedTotal.js';

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
  slot.mpLostWindowNow = true; // Needs: lost MP since the start of the owner's last turn (70-06)

  let getemt = null;
  // Ctrl+S (rules 13, D-24): a protected Level 2-3 Mosje stays at 0 MP and keeps its level, no Level Down hook.
  const keepsLevel = slot.mp <= 0 && slot.level >= 2 && getTimedTotal(state, playerId, slotIndex, 'noLevelDrop') > 0;
  if (slot.mp <= 0 && !keepsLevel) getemt = applyGetemt(slot);
  slot.mp = Math.max(0, slot.mp);
  // Not Today! (Snelle): the Mosje that would go to the Welloe pile stays, at 5 MP minimum (sideways stays sideways).
  if (getemt === 'welloe' && takeReactionMod(state, 'save', playerId, slotIndex)) {
    slot.mp = Math.max(slot.mp, 5);
    delete slot._pendingWelloe;
    getemt = null;
  }
  // Tactician set: a loss is kept (subtracted via the delta); a getemt ends the set early.
  if (slot.tacticianSet) {
    if (getemt) delete slot.tacticianSet;
    else slot.tacticianSet.delta -= final;
  }
  if (getemt === 'dropped') runKeywordHook(state, 'levelDown', slot.cardId, { playerId, slotIndex, level: slot.level });
  return { final, getemt };
}
