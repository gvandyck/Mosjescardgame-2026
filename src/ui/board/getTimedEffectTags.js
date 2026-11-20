// getTimedEffectTags.js - (state, playerId, slotIndex) -> [{ id, text, kind }] for the tile of one Mosje (72-06, D-07).
// Order: timed effects (state order), die grants bound to this slot, the Blensen! shield. Pure read, nothing is stored.
import { countsForSlot } from '../../engine/durations/getTimedTotal.js';
import { isShielded } from '../../engine/targets/isShielded.js';
import { describeTimedEffect } from './describeTimedEffect.js';

function dieText(amount) {
	const n = Math.abs(Number(amount));
	if (!n) return '';
	if (amount < 0) return `Rolls ${n} ${n === 1 ? 'die' : 'dice'} less on its next Quest`;
	return `Rolls ${n} more ${n === 1 ? 'die' : 'dice'} on its next Quest`;
}

export function getTimedEffectTags(state, playerId, slotIndex) {
	const player = state?.players?.[playerId];
	const slot = player?.activeSlots?.[slotIndex];
	if (!slot || slot.isDefeated) return [];
	const tags = [];
	for (const e of Array.isArray(state.timedEffects) ? state.timedEffects : []) {
		const t = e?.target;
		if (!t || t.playerId !== playerId || t.slotIndex !== slotIndex || t.cardId !== slot.cardId) continue;
		if (!countsForSlot(state, e, slot)) continue;
		const text = describeTimedEffect(e);
		if (text) tags.push({ id: e.id, text, kind: 'effect' });
	}
	(player.questDiceGrants || []).forEach((g, i) => {
		if (!g || !Number.isInteger(g.slotIndex) || g.slotIndex !== slotIndex || g.cardId !== slot.cardId) return;
		const text = dieText(g.amount);
		if (text) tags.push({ id: `die_${i}`, text, kind: 'effect' });
	});
	// Blensen! protects every Mosje of the owner for the turn (the acting player is the other one)
	const other = Object.keys(state.players).find(id => id !== playerId);
	if (isShielded(state, playerId, other)) tags.push({ id: 'blensen', text: 'Shielded from cards this turn', kind: 'shield' });
	return tags;
}
