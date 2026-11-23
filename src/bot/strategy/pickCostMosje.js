// pickCostMosje - the bot's answer to the cost step ("Which Mosje pays?", key cost_mosje). Options are { playerId, slotIndex, label }.
// A Power card (Te Hard Gaan, Ronalds Fles Fireman; CC-7): the Mosje that can attack this turn and keeps MP above 0, never the
// Level 3 keeper, most Power first (attackingPayers). Anything else, or no such Mosje: the own Mosje with the most MP, so the
// price leaves it above 0 whenever any Mosje can manage that; a Level 3 keeper is spared while another option exists.
// Called by chooseTriggerChoice with the bot's table view (BOT-04). Returns one of the options, or undefined (malformed) so the caller takes the first.
import { getCardTags } from './comboTags.js';
import { attackingPayers } from './attackingPayers.js';
import { getPersonalQuestPlan } from './getPersonalQuestPlan.js';

export function pickCostMosje(table, botId, pendingChoice) {
	const options = pendingChoice?.options;
	const slotOf = (o) => table.players?.[o?.playerId ?? botId]?.activeSlots?.[o?.slotIndex];
	if (!Array.isArray(options) || options.length === 0 || !options.every(o => slotOf(o))) return undefined;
	const cardId = pendingChoice.piecie?.cardDef?.id;
	if (cardId && getCardTags(cardId).includes('power')) {
		const order = attackingPayers(table, botId, cardId);
		const hit = order.map(i => options.find(o => o.slotIndex === i)).find(Boolean);
		if (hit) return hit;
	}
	const plan = getPersonalQuestPlan(table, botId);
	const keeper = plan?.phase === 'ready' ? plan.keeperIndex : -1;
	const spared = options.filter(o => o.slotIndex !== keeper);
	const pool = spared.length ? spared : options;
	// the price is the same for every option, so the highest MP is also the highest MP left
	return pool.reduce((top, o) => ((Number(slotOf(o).mp) || 0) > (Number(slotOf(top).mp) || 0) ? o : top));
}
