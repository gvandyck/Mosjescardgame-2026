// pickCardOrder — ask for cards from the top N of a deck, position by position, with the generic option modal.
// mode 'order': returns indices (into the top N) in the new top-first order; mode 'pick': `count` indices.
// Returns null if the player cancelled.
import { toGraveyardEntry } from '../../engine/graveyardUtils.js';

export async function pickCardOrder({ modal, deck, n, mode = 'order', count = n, title = 'Top of the deck' }) {
	const top = deck.slice(0, n).map((c, i) => ({ i, name: toGraveyardEntry(c.cardId, 'x').name }));
	const chosen = [];
	const want = Math.min(mode === 'pick' ? count : top.length, top.length);
	while (chosen.length < want) {
		const left = top.filter(t => !chosen.includes(t.i));
		const ord = chosen.length + 1;
		const id = await modal.showOptionSelect({
			title: mode === 'pick' ? `${title}: pick card ${ord} of ${want}` : `${title}: card ${ord} from the top`,
			options: left.map(t => ({ id: String(t.i), label: t.name })),
			allowCancel: true,
			autoSelectSingle: mode === 'order' && left.length === 1,
		});
		if (id == null) return null;
		chosen.push(Number(id));
	}
	return chosen;
}
