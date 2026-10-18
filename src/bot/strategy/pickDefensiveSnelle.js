// pickDefensiveSnelle - the bot's answer when one of its Mosjes is about to lose MP, is attacked, targeted or sent to
// the Welloe pile (BOT-03): a Snelle id from the open window, or null (pass, the card is saved). Not Today! always goes
// first at a Welloe move. Otherwise the card is worth it only when the Mosje is in danger (getemt, Level 3, or a loss
// worth 20+); then the cheapest Snelle after which the Mosje survives, else the biggest cut. Bot valuation, no rule.
import { SNELLE_LOSS_CUT } from './cardAmounts.js';
import { getPower } from '../../engine/mp/getPower.js';
import { canBotAfford } from './canBotAfford.js';
import { getBotPaymentCost } from './getBotPaymentCost.js';
import { valueOfLoss } from './valueOfLoss.js';
import { asBotView } from './asBotView.js';

// Card List order: the tie-break between two Snelle of the same price.
const ORDER = ['snelle_jensen', 'snelle_counter_strikka', 'snelle_the_protector', 'snelle_perfect_dodge', 'snelle_drain_reversal', 'snelle_emergency_healings', 'snelle_blensen'];
const STOPS_THE_CARD = ['snelle_jensen', 'snelle_counter_strikka', 'snelle_blensen'];
const DANGER = 20;

// The Mosje's MP loss. A preview loss stops at the MP it had (a Mosje that goes sideways or drops a level shows less than
// the hit), so for a getemt slot the hit is at least its MP, and for an attack at least the attacker's Power (table info).
function expectedLoss(view, p, slot, i) {
	const seen = Number(p.preview?.mpLoss?.[i]) || 0;
	if (!(p.preview?.getemt || []).includes(i)) return seen;
	const [attackerId, params] = p.action?.type === 'attack' ? p.action.args || [] : [];
	const hit = params && params.targetSlotIndex === i && params.targetPlayerId === p.responderId;
	const attacker = hit ? view.players[attackerId]?.activeSlots?.[params.attackerSlotIndex] : null;
	return Math.max(seen, Number(slot.mp) || 0, attacker ? getPower(attacker, view, attackerId) : 0);
}

function remainingLoss(id, loss, slot) {
	const cut = SNELLE_LOSS_CUT[id];
	if (!cut) return 0;
	const amount = cut.upgraded && (slot.traits?.[cut.trait] || 0) >= cut.stars ? cut.upgraded : cut.base;
	return Math.max(0, loss - amount);
}

export function pickDefensiveSnelle(state, responderId) {
	const view = asBotView(state, responderId); // BOT-04: from here on `view` is the table view
	const p = view.pendingReaction;
	if (!p || p.responderId !== responderId) return null;
	const moments = p.moments || [];
	const preview = p.preview || {};
	const can = (id) => (p.eligible || []).includes(id) && canBotAfford(view, responderId, id, 'snelle');
	if ((moments.includes('toWelloe') || preview.toWelloe || (preview.welloeSlots || []).length) && can('snelle_negate_elimination')) return 'snelle_negate_elimination';

	const own = view.players[responderId]?.activeSlots || [];
	const placeId = view.activePlace || view.sharedPlaceSlot?.cardId || null;
	const targeted = moments.includes('targeted');
	const candidates = ORDER.filter(id => can(id) && (targeted || !STOPS_THE_CARD.includes(id)) && !(id === 'snelle_emergency_healings' && placeId === 'place_the_void')
		&& !(id === 'snelle_counter_strikka' && own.filter(s => s && !s.isDefeated).length < 2)); // nowhere else to send the hit
	if (!candidates.length) return null;

	const threatened = [...new Set([...Object.keys(preview.mpLoss || {}).map(Number), ...(preview.getemt || [])])]
		.filter(i => own[i] && !own[i].isDefeated)
		.map(i => {
			const slot = own[i];
			const loss = expectedLoss(view, p, slot, i);
			const worth = valueOfLoss(slot, loss);
			return { i, slot, loss, worth, danger: (preview.getemt || []).includes(i) || slot.level >= 3 || worth >= DANGER };
		})
		.filter(t => t.danger)
		.sort((a, b) => b.worth - a.worth || b.slot.level - a.slot.level || a.i - b.i);
	if (!threatened.length) return null;

	const { slot, loss, i } = threatened[0];
	const cutsNothing = (preview.welloeSlots || []).includes(i) && p.action?.type !== 'attack'; // a card sends it to the Welloe pile: no MP loss to cut
	const options = candidates.map((id, order) => {
		const rest = STOPS_THE_CARD.includes(id) ? 0 : cutsNothing ? loss : remainingLoss(id, loss, slot);
		return { id, order, rest, cut: STOPS_THE_CARD.includes(id) ? Math.max(loss, 1) : loss - rest, cost: getBotPaymentCost(view, responderId, id, 'snelle'), survives: rest === 0 || (Number(slot.mp) || 0) - rest > 0 };
	});
	const byCost = (a, b) => a.cost - b.cost || a.order - b.order;
	const saving = options.filter(o => o.survives && o.cut > 0).sort(byCost);
	if (saving.length) return saving[0].id;
	const cutting = options.filter(o => o.cut > 0).sort((a, b) => b.cut - a.cut || byCost(a, b));
	return cutting[0]?.id ?? null;
}
