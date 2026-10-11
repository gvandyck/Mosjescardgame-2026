// checkLoss — Obby 2.0 §2c: a player has lost when no Mosje of theirs is left on the
// field, in hand or in the deck. Discard pile and Welloe pile do not count (decision 2).
import { MOSJES } from '../../data/mosjes.js';

const MOSJE_IDS = new Set(MOSJES.map((m) => m.id));
const isMosjeCard = (c) => !!c && (c.type === 'MOSJE' || MOSJE_IDS.has(c.cardId));

export function checkLoss(player) {
	if (!player) return false;
	if ((player.activeSlots || []).some((s) => s && !s.isDefeated)) return false;
	if ((player.hand || []).some(isMosjeCard)) return false;
	if ((player.deck || []).some(isMosjeCard)) return false;
	return true;
}
