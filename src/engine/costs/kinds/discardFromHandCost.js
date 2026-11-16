// discardFromHand { tag? | type?, count } - discard cards from the hand that match the tag (Piecie tag) or the card
// type. choice.handCardIds says which (default: the first matches). ctx.excludeCardId = the card being paid for,
// never a candidate. A chosen card that does not qualify is refused (T-70-07).
import { PIECIES } from '../../../data/piecies.js';
import { toGraveyardEntry } from '../../graveyardUtils.js';

const TAGS = Object.fromEntries(PIECIES.map(p => [p.id, p.tag]));

function matches(card, cost) {
	if (cost.tag !== undefined && TAGS[card.cardId] !== cost.tag) return false;
	if (cost.type !== undefined && card.type !== cost.type) return false;
	return true;
}

// Hand indexes to pay with, or a reason string.
function pick(ctx, cost, choice) {
	const hand = ctx.state.players[ctx.playerId]?.hand || [];
	const count = cost.count ?? 1;
	const cands = hand.map((c, i) => ({ c, i })).filter(({ c }) => c.cardId !== ctx.excludeCardId && matches(c, cost));
	if (cands.length < count) return `Needs ${count} matching card(s) in hand to discard`;
	const wanted = choice && Array.isArray(choice.handCardIds) ? choice.handCardIds : null;
	if (!wanted) return cands.slice(0, count).map(x => x.i);
	if (wanted.length !== count) return `Choose exactly ${count} card(s) to discard`;
	const used = [];
	for (const id of wanted) {
		const hit = cands.find(x => x.c.cardId === id && !used.includes(x.i));
		if (!hit) return 'That card cannot be discarded for this cost';
		used.push(hit.i);
	}
	return used;
}

export const discardFromHandCost = {
	canPay(ctx, cost, choice) {
		const r = pick(ctx, cost, choice);
		return typeof r === 'string' ? r : true;
	},
	pay(ctx, cost, choice) {
		const player = ctx.state.players[ctx.playerId];
		const idx = pick(ctx, cost, choice);
		const gone = idx.map(i => player.hand[i]);
		player.hand = player.hand.filter((_, i) => !idx.includes(i));
		player.graveyard = [...(player.graveyard || []), ...gone.map(c => toGraveyardEntry(c.cardId, 'discarded'))];
	},
};
