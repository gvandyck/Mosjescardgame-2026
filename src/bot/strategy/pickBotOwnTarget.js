// pickBotOwnTarget — which of its own Mosjes the bot aims a "your Mosje" Piecie at.
// Gain effects: highest MP (closest to the next level). Others: highest Power. Ties: lower slot.
import { PIECIES } from '../../data/piecies.js';
import { MOSJES } from '../../data/mosjes.js';
import { getCardTags } from './comboTags.js';

function powerOf(slot) {
	const def = MOSJES.find(m => m.id === slot.cardId);
	return def?.levels?.[(slot.level || 1) - 1]?.power ?? 0;
}

export function pickBotOwnTarget(state, botId, effectId) {
	const slots = state.players?.[botId]?.activeSlots || [];
	const card = PIECIES.find(p => p.effectId === effectId);
	const isGain = !!card && getCardTags(card.id).includes('mp-gain');
	const score = s => (isGain ? (s.mp || 0) : powerOf(s));
	let best = -1;
	slots.forEach((s, i) => {
		if (!s || s.isDefeated) return;
		if (best < 0 || score(s) > score(slots[best])) best = i;
	});
	return best;
}
