// pieciesHeldInHand - hand indexes the bot keeps because the held Personal Quest Pays them (CC-5), plus `maxTake`: how many
// Piecies it may still put out of the hand so that `handFloor` OTHER cards stay (the Personal Quest card itself is not counted).
import { asBotView } from './asBotView.js';
import { PIECIES } from '../../data/piecies.js';

const TAG_BY_ID = Object.fromEntries(PIECIES.map(p => [p.id, p.tag]));

export function pieciesHeldInHand(state, botId, plan) {
	const view = asBotView(state, botId);
	const keep = new Set();
	if (!plan?.holdActive) return { keep, maxTake: Infinity };
	const hand = view.players?.[botId]?.hand || [];
	for (const k of plan.keepHand || []) {
		let left = k.count ?? 1;
		hand.forEach((c, i) => {
			if (left <= 0 || keep.has(i)) return;
			const match = k.tag !== undefined ? c.type === 'PIECIE' && TAG_BY_ID[c.cardId] === k.tag : c.type === k.type;
			if (match) { keep.add(i); left -= 1; }
		});
	}
	const maxTake = plan.handFloor > 0 ? Math.max(0, hand.length - 1 - plan.handFloor) : Infinity;
	return { keep, maxTake };
}
