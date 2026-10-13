// offerHistorianKeep - Martin, The Historian holder text (Cless, The Teacher / Synergy Chamber): when Time Control looks at
// YOUR OWN deck you may put 1 of those 5 cards into your hand. Asks with the generic option modal.
// Returns the chosen cardId, or null (keep them all on top / cancelled / not eligible).
import { isHolderTextActive } from '../../engine/synergy/isHolderTextActive.js';
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';

const HISTORIAN = 'mosje_martin_historian';

export async function offerHistorianKeep({ state, playerId, modal, collected }) {
	if (collected?.deck_owner !== playerId || !isHolderTextActive(state, playerId, HISTORIAN)) return null;
	const deck = state.players[playerId].deck;
	const top = (collected.order || []).map(i => deck[i]).filter(Boolean);
	if (!top.length) return null;
	const id = await modal.showOptionSelect({
		title: 'Time Control: keep a card?',
		prompt: 'Cless, The Teacher is on your field: put 1 of these cards into your hand, or keep them all on top.',
		options: [{ id: 'none', label: 'Keep all on top' }, ...top.map((c, i) => ({ id: String(i), label: toGraveyardEntry(c.cardId, 'x').name }))],
	});
	return id == null || id === 'none' ? null : top[Number(id)].cardId;
}
