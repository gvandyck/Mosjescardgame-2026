// discardReadyPiecie { tag?, count } - discard ready Piecies (face-down ready slots or attached cards) of that tag.
// choice.readyPiecies lists which (entries as getReadyPiecies returns them); default: the first ones that qualify.
// A chosen entry that is not a qualifying ready card is refused (T-70-07).
import { getReadyPiecies } from '../../attachments/getReadyPiecies.js';
import { toGraveyardEntry } from '../../graveyardUtils.js';

const same = (a, b) => a.zone === b.zone && a.cardId === b.cardId
	&& (a.zone === 'slot' ? a.slotIndex === b.slotIndex : a.mosjeSlotIndex === b.mosjeSlotIndex && a.attachIndex === b.attachIndex);

// The entries to pay with, or a reason string.
function pick(ctx, cost, choice) {
	const all = getReadyPiecies(ctx.state, ctx.playerId, cost.tag === undefined ? {} : { tag: cost.tag });
	const count = cost.count ?? 1;
	if (all.length < count) return `Needs ${count} ready ${cost.tag || ''} Piecie(s) to discard`.replace('  ', ' ');
	const wanted = choice && Array.isArray(choice.readyPiecies) ? choice.readyPiecies : null;
	if (!wanted) return all.slice(0, count);
	if (wanted.length !== count) return `Choose exactly ${count} ready Piecie(s) to discard`;
	const out = [];
	for (const w of wanted) {
		const hit = all.find(a => same(a, w) && !out.includes(a));
		if (!hit) return 'That is not a ready Piecie you can discard';
		out.push(hit);
	}
	return out;
}

export const discardReadyPiecieCost = {
	canPay(ctx, cost, choice) {
		const r = pick(ctx, cost, choice);
		return typeof r === 'string' ? r : true;
	},
	pay(ctx, cost, choice) {
		const player = ctx.state.players[ctx.playerId];
		const entries = pick(ctx, cost, choice);
		// attached cards: highest index first so the earlier indexes stay valid
		const attached = entries.filter(e => e.zone === 'attached').sort((a, b) => b.attachIndex - a.attachIndex);
		for (const e of entries.filter(e => e.zone === 'slot')) player.piecieSlots[e.slotIndex] = null;
		for (const e of attached) player.activeSlots[e.mosjeSlotIndex].attachments.splice(e.attachIndex, 1);
		player.graveyard = [...(player.graveyard || []), ...entries.map(e => toGraveyardEntry(e.cardId, 'discarded'))];
	},
};
