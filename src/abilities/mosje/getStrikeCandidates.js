// getStrikeCandidates — Elimination Strike targets: the opponent's non-fresh Mosjes of the lowest level on the field
// (among the non-fresh ones). Returns pendingChoice options [{ label, playerId, slotIndex }].
import { isFresh } from '../../engine/fresh/isFresh.js';

export function getStrikeCandidates(state, oppId) {
	const open = (state.players[oppId]?.activeSlots || [])
		.map((s, slotIndex) => ({ s, slotIndex }))
		.filter(({ s }) => s && !s.isDefeated && !isFresh(s));
	if (!open.length) return [];
	const lowest = Math.min(...open.map(({ s }) => s.level || 1));
	return open.filter(({ s }) => (s.level || 1) === lowest)
		.map(({ s, slotIndex }) => ({ label: s.name, playerId: oppId, slotIndex }));
}
