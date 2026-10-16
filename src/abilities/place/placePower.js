// placePowerBonus - the Power change the active Place gives one Mosje (Card List 2.0). Fresh Mosjes ignore Places.
import { isFresh } from '../../engine/fresh/isFresh.js';
import { PIECIES } from '../../data/piecies.js';

const hasWord = (slot, word) => String(slot?.name || '').split(/[^A-Za-z]+/).includes(word);
const hasStayingPet = (state, ownerId) => (state?.players?.[ownerId]?.piecieSlots || []).some(
	e => e && e.stays === true && e.faceDown !== true && PIECIES.find(p => p.id === e.cardId)?.tag === 'pet');

export function placePowerBonus(state, slot, ownerId) {
	const place = state?.activePlace;
	if (!place || !slot || isFresh(slot)) return 0;
	const type = slot.subtype;
	switch (place) {
		case 'place_the_gym': return type === 'FIGHTING' ? 10 : 0;
		case 'place_boxing_ring':
			if (type === 'FIGHTING') return hasWord(slot, 'Gandoe') ? 20 : 10;
			return type === 'DIGITAL' || type === 'ARTISTIC' ? -10 : 0;
		case 'place_de_box': return ['Gandoe', 'Michelle', 'Tuk'].some(n => hasWord(slot, n)) ? 10 : 0;
		case 'place_arcade': return type === 'FIGHTING' ? -10 : 0;
		case 'place_skiffa': return type === 'DIGITAL' ? -10 : 0;
		case 'place_bank_chilling': return -10;
		case 'place_drain_zone': return 10;
		case 'place_dierenasiel': return hasStayingPet(state, ownerId) ? 0 : -10;
		default: return 0;
	}
}
