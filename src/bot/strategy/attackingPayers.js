// attackingPayers - the own slots that may pay the MP price of a Power card (CC-7: Te Hard Gaan, Ronalds Fles Fireman):
// a Mosje that can still attack this turn (not fresh, one action left), is not the Level 3 keeper and stays above 0 MP
// after the price. Most Power first, then most MP. The +20 Power goes to the payer, so it must be one that attacks.
import { canMosjeTakeAction } from '../../engine/actions/canMosjeTakeAction.js';
import { isFresh } from '../../engine/fresh/isFresh.js';
import { getPower } from '../../engine/mp/getPower.js';
import { asBotView } from './asBotView.js';
import { getPersonalQuestPlan } from './getPersonalQuestPlan.js';
import { SELF_LOSS_MP } from './cardAmounts.js';

export function attackingPayers(state, botId, cardId) {
	const view = asBotView(state, botId); // BOT-04: from here on `view` is the table view
	const plan = getPersonalQuestPlan(view, botId);
	const keeper = plan?.phase === 'ready' ? plan.keeperIndex : -1;
	const price = SELF_LOSS_MP[cardId] ?? 0;
	const slots = view.players?.[botId]?.activeSlots || [];
	return slots
		.map((slot, i) => ({ slot, i }))
		.filter(({ slot, i }) => slot && !slot.isDefeated && i !== keeper && !isFresh(slot)
			&& canMosjeTakeAction(view, botId, i).ok && (Number(slot.mp) || 0) - price > 0)
		.sort((a, b) => getPower(b.slot, view, botId) - getPower(a.slot, view, botId) || (Number(b.slot.mp) || 0) - (Number(a.slot.mp) || 0))
		.map(({ i }) => i);
}
