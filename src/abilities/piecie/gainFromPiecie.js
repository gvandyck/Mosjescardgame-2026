// gainFromPiecie - one Mosje gains MP from a Piecie. A food Piecie gives +10 more while Binti's Coert holder text is
// active for the activator (never on a loss).  MP Amplifier is applied inside gainMP. Returns a new state.
import { gainMP } from '../../engine/mpManager.js';
import { isHolderTextActive } from '../../engine/synergy/isHolderTextActive.js';

export function gainFromPiecie(state, playerId, slotIndex, amount, cardDef, targetPlayerId = playerId) {
	let total = amount;
	if (cardDef?.tag === 'food' && isHolderTextActive(state, playerId, 'mosje_binti')) total += 10;
	return gainMP(state, targetPlayerId, slotIndex, total, 'PIECIE');
}
