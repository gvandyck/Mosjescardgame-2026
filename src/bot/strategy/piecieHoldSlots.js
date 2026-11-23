// piecieHoldSlots - own Piecie slots NOT to activate this turn because the held Personal Quest names them under Needs/Pay
// (CC-5). Only while plan.holdActive. For each keepPiecies entry the first `count` ready slots (by name or PIECIES tag) are held.
import { asBotView } from './asBotView.js';
import { isPiecieReady } from '../../engine/table/isPiecieReady.js';
import { PIECIES } from '../../data/piecies.js';

const TAG_BY_ID = Object.fromEntries(PIECIES.map(p => [p.id, p.tag]));

export function piecieHoldSlots(state, botId, plan) {
	const view = asBotView(state, botId);
	const held = new Set();
	if (!plan?.holdActive) return held;
	const slots = view.players?.[botId]?.piecieSlots || [];
	for (const k of plan.keepPiecies || []) {
		let left = k.count ?? 1;
		slots.forEach((slot, i) => {
			if (left <= 0 || held.has(i) || !isPiecieReady(slot, view.turnNumber)) return;
			const match = k.name !== undefined ? slot.cardId === k.name : TAG_BY_ID[slot.cardId] === k.tag;
			if (match) { held.add(i); left -= 1; }
		});
	}
	return held;
}
