// pieceDef - the Piecie card definition for an id (data/piecies.js).
import { PIECIES } from '../../data/piecies.js';

export function pieceDef(cardId) {
	return PIECIES.find(p => p.id === cardId) || null;
}
