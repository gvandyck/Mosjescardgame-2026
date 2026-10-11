// isValidAttackTarget — opponent Mosje, not fresh, not level-up protected (sideways allowed, §2d).
import { isFresh } from '../fresh/isFresh.js';

export function isValidAttackTarget(state, attackerPlayerId, targetPlayerId, targetSlotIndex) {
  if (!targetPlayerId || targetPlayerId === attackerPlayerId) return false;
  const t = state.players?.[targetPlayerId]?.activeSlots?.[targetSlotIndex];
  return !!t && !t.isDefeated && !isFresh(t) && !t.levelUpProtected;
}
