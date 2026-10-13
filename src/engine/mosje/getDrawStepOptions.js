// getDrawStepOptions — the draw-step abilities (Coert Tech, Martin Historian) this player can use now.
import { MOSJE_TRIGGERS } from './mosjeTriggers.js';
import { canMosjeAct } from '../mp/canMosjeAct.js';

export function getDrawStepOptions(state, playerId) {
	const slots = state.players[playerId]?.activeSlots || [];
	const options = [];
	for (const entry of MOSJE_TRIGGERS.drawStep) {
		const live = slots.some(s => s && !s.isDefeated && s.cardId === entry.mosjeId && canMosjeAct(s));
		if (live && (!entry.available || entry.available(state, playerId))) options.push({ mosjeId: entry.mosjeId });
	}
	return options;
}
