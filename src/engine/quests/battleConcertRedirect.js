// battleConcertRedirect - Battle Concert: an Alyssa that fails a Quest this turn loses nothing; one non-fresh opponent
// Mosje loses 15 MP instead (the one picked at activation, else the first eligible). Used once, then the flag ends.
// Returns the new state when it applied, or null (the fail is paid normally). Mutates the given, already cloned, state.
import { loseMP } from '../mpManager.js';
import { isFresh } from '../fresh/isFresh.js';

export function battleConcertRedirect(state, playerId, slot) {
	if (state._battleConcertActive !== playerId || !String(slot?.cardId).startsWith('mosje_alyssa')) return null;
	const picked = state._battleConcertTarget;
	delete state._battleConcertActive;
	delete state._battleConcertTarget;
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	const slots = state.players[oppId]?.activeSlots || [];
	const ok = (s) => s && !s.isDefeated && !isFresh(s);
	let at = picked && slots[picked.slotIndex]?.cardId === picked.cardId && ok(slots[picked.slotIndex]) ? picked.slotIndex : -1;
	if (at < 0) at = slots.findIndex(ok);
	return at < 0 ? state : loseMP(state, oppId, at, 15, 'DRAIN', false, playerId);
}
