// pickMosje - the Mosje a Snelle pick asks for. Returns { slot } (chosen or the only option), { none: true } (no legal
// Mosje) or { needChoice } for the runner to pause on. Opponent picks never offer fresh Mosjes.
import { isFresh } from '../../engine/fresh/isFresh.js';

export function mosjeOptions(state, playerId, who, filter = () => true) {
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	const pid = who === 'own' ? playerId : oppId;
	const out = [];
	(state.players[pid]?.activeSlots || []).forEach((slot, slotIndex) => {
		if (!slot || slot.isDefeated || !filter(slot, slotIndex)) return;
		if (who === 'opp' && isFresh(slot)) return;
		out.push({ playerId: pid, slotIndex, label: slot.name });
	});
	return out;
}

export function pickMosje(state, playerId, key, who, prompt, filter) {
	const options = mosjeOptions(state, playerId, who, filter);
	if (!options.length) return { none: true };
	if (options.length === 1) return { slot: options[0] };
	const given = state.players[playerId]._pendingTargets?.[key];
	const slot = given && options.find(o => o.playerId === given.playerId && o.slotIndex === given.slotIndex);
	if (slot) return { slot };
	return { needChoice: { playerId, key, options, choiceKind: 'mosje', prompt } };
}

export function clearPicks(state, playerId, ...keys) {
	for (const k of keys) delete state.players[playerId]._pendingTargets?.[k];
}
