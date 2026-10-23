// getHandPlayCost.js — the Energy it costs to play a hand card right now, as the engine pays it (63-UI-SPEC spend preview).
// Mosje summon and Place = the card's cost; Snelle = getSnelleCost; a Piecie from hand is placed face-down for free (its
// cost is paid on activation). The Delluft parking fee rides on top of any paid card, like payEnergy adds it.
import { getCardEnergyCost } from '../../engine/energy/getCardEnergyCost.js';
import { getSnelleCost } from '../../engine/energy/getSnelleCost.js';
import { delluftFee } from '../../engine/energy/delluftFee.js';
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';

function baseCost(state, playerId, cardId, type) {
	if (type === 'MOSJE' || type === 'PLACE') return getCardEnergyCost(cardId);
	if (type === 'SNELLE_PIECIE') return getSnelleCost(state, playerId, SNELLE_PIECIES.find((def) => def.id === cardId));
	return 0;
}

export function getHandPlayCost(state, playerId, { cardId, type } = {}) {
	const cost = Number(baseCost(state, playerId, cardId, type)) || 0;
	if (!state || cost <= 0) return Math.max(0, cost);
	return cost + delluftFee(state, playerId, cost);
}
