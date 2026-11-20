// askStartingMosje - D-15 (72-13): the player picks the starting Mosje from the deck's Mosjes, shown as card faces.
// No cancel and no leave option: a pick is required. Returns the chosen cardId (null only if the deck has no Mosjes).
import { MOSJES } from '../../data/mosjes.js';

export async function askStartingMosje({ modal, deck }) {
	const ids = (Array.isArray(deck?.mosjes) ? deck.mosjes : []).filter(Boolean);
	if (!ids.length) return null;
	const options = ids.map(cardId => ({ id: cardId, cardId, label: MOSJES.find(m => m.id === cardId)?.name ?? cardId }));
	return modal.showOptionSelect({ title: 'Choose your starting Mosje', prompt: 'It starts on your field, free.', options });
}
