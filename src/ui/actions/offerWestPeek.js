// offerWestPeek - Martin, Senor West holder text (AZN Cless on your field / Synergy Chamber): once per turn you may look at
// the top card of a Quest stack before attempting. Offered at the start of your Quest flow with the generic option modal;
// the peeked card is shown to you only. Returns the state (with the once-per-turn flag set when you looked).
import { senorWestPeekQuestStack } from '../../abilities/mosje/senorWestPeekQuestStack.js';
import { isHolderTextActive } from '../../engine/synergy/isHolderTextActive.js';
import { getQuestDef } from '../../engine/quests/getQuestDef.js';
import { QUEST_STACK_IDS } from '../../engine/setup/setupRules.js';

export async function offerWestPeek({ state, playerId, modal }) {
	if (!isHolderTextActive(state, playerId, 'mosje_martin_senor_west')) return state;
	if (state.players[playerId].westPeekTurn === state.turnNumber) return state;
	const stacks = QUEST_STACK_IDS.filter(id => state.questStacks?.[id]?.deck?.length);
	if (!stacks.length) return state;
	const id = await modal.showOptionSelect({
		title: 'Senor West: look at a Quest stack?',
		prompt: 'AZN Cless is on your field: once per turn you may look at the top card of a Quest stack before attempting.',
		options: [{ id: 'no', label: 'Just attempt a Quest' }, ...stacks.map(s => ({ id: s, label: `Look at the top of the ${s} stack` }))],
	});
	if (id == null || id === 'no') return state;
	const res = senorWestPeekQuestStack(state, playerId, id);
	if (!res.success) return state;
	await modal.showOptionSelect({
		title: `Top of the ${id} stack`,
		prompt: getQuestDef(res.cardId)?.name || String(res.cardId),
		options: [{ id: 'ok', label: 'OK' }],
	});
	return res.state;
}
