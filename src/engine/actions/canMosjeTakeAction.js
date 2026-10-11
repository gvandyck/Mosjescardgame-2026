// canMosjeTakeAction — the shared one-action gate (2.0 §2c): attack OR Quest, once per Mosje per turn.
import { canMosjeAct } from '../mp/canMosjeAct.js';
import { isCooldownBlocked, COOLDOWN_ERROR } from '../turn/isCooldownBlocked.js';

export function canMosjeTakeAction(state, playerId, slotIndex) {
  if (playerId !== state.activePlayerId) return { ok: false, error: 'Not your turn' };
  if (isCooldownBlocked(state, playerId)) return { ok: false, error: COOLDOWN_ERROR };
  const slot = state.players?.[playerId]?.activeSlots?.[slotIndex];
  if (!slot) return { ok: false, error: 'No Mosje in that slot' };
  if (!canMosjeAct(slot)) return { ok: false, error: 'This Mosje cannot act' };
  if (slot.actedThisTurn) return { ok: false, error: 'This Mosje already acted this turn' };
  return { ok: true };
}
