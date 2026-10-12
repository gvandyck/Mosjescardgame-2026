// getJabTargets — legal jab targets after a Quest win: opponent slots, alive, not fresh (level-up-protected IS hit).
import { isFresh } from '../fresh/isFresh.js';
import { QUEST_EXTRAS } from './questExtras.js';

export function getJabTargets(state, winnerId, questId, pending = {}) {
	const kind = QUEST_EXTRAS[questId]?.jab;
	if (!kind) return [];
	if (kind === 'larryOnly' && !(pending.discardedCardIds || []).includes('piecie_larry_zegeltje')) return [];
	const out = [];
	for (const [playerId, p] of Object.entries(state.players)) {
		if (playerId === winnerId) continue;
		p.activeSlots.forEach((slot, slotIndex) => {
			if (!slot || slot.isDefeated || isFresh(slot)) return;
			if (kind === 'nonDigital' && slot.subtype === 'DIGITAL') return;
			out.push({ playerId, slotIndex });
		});
	}
	if (kind === 'mostMp' && out.length) {
		const top = Math.max(...out.map(t => state.players[t.playerId].activeSlots[t.slotIndex].mp));
		return out.filter(t => state.players[t.playerId].activeSlots[t.slotIndex].mp === top);
	}
	return out;
}
