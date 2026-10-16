// getCardEnergyCost - the Energy a card costs (its `cost` field, any card kind; unknown or Quest = 0).
import { MOSJES } from '../../data/mosjes.js';
import { PIECIES } from '../../data/piecies.js';
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { PLACES } from '../../data/places.js';

const COSTS = new Map([...MOSJES, ...PIECIES, ...SNELLE_PIECIES, ...PLACES].map(c => [c.id, Number(c.cost) || 0]));

export function getCardEnergyCost(cardId) {
	return COSTS.get(cardId) || 0;
}
