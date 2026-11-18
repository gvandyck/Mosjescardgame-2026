// gainFromPiecie - one Mosje gains MP from a Piecie.  MP Amplifier is applied inside gainMP. Returns a new state.
import { gainMP } from '../../engine/mpManager.js';
import { getFoodBonus } from '../../engine/mp/getFoodBonus.js';

export function gainFromPiecie(state, playerId, slotIndex, amount, cardDef, targetPlayerId = playerId) {
	let total = amount + getFoodBonus({ state, playerId, cardDef, targetPlayerId, slotIndex });
	return gainMP(state, targetPlayerId, slotIndex, total, 'PIECIE');
}
