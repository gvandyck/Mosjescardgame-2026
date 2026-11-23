// getPersonalQuestPlan - the bot's Personal Quest plan (CC-1, CC-5): the keeper (own live Mosje whose type matches a
// Personal Quest in the bot's own hand), its phase and what the held Personal Quests ask to hold back. Pure; null = no plan.
import { asBotView } from './asBotView.js';
import { getPersonalQuestDef } from '../../engine/personalQuests/getPersonalQuestDef.js';
import { pqHoldLists } from './pqHoldLists.js';
import { PQ_VALUES } from './pqValues.js';

export function getPersonalQuestPlan(state, botId) {
	const view = asBotView(state, botId);
	const player = view.players?.[botId];
	const defs = [];
	for (const c of player?.hand || []) {
		const def = c.type === 'PERSONAL_QUEST' ? getPersonalQuestDef(c.cardId) : null;
		if (def && !defs.includes(def)) defs.push(def);
	}
	let keeperIndex = -1;
	let keeper = null;
	(player?.activeSlots || []).forEach((slot, i) => {
		if (!slot || slot.isDefeated || !defs.some(d => d.mosjeType === slot.subtype)) return;
		const better = !keeper || slot.level > keeper.level || (slot.level === keeper.level && slot.mp > keeper.mp);
		if (better) { keeper = slot; keeperIndex = i; }
	});
	if (!keeper) return null;
	const matching = defs.filter(d => d.mosjeType === keeper.subtype);
	return {
		keeperIndex,
		phase: keeper.level >= 3 ? 'ready' : 'grow',
		holdActive: keeper.level >= 3 || (keeper.level === 2 && keeper.mp >= PQ_VALUES.NEAR_L3_MP),
		cardIds: matching.map(d => d.id),
		...pqHoldLists(matching),
	};
}
