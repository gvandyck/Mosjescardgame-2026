// gainFromPiecie - one Mosje gains MP from a Piecie. A food Piecie gives +10 more while Binti's Coert holder text is
// active for the activator (never on a loss). Interim: also consumes the V4 MP Amplifier flag (x1.5, 5-grid) until
// the MP Amplifier rewrite. Returns a new state.
import { gainMP } from '../../engine/mpManager.js';
import { roundToFive } from '../../engine/roundToFive.js';
import { isHolderTextActive } from '../../engine/synergy/isHolderTextActive.js';

export function gainFromPiecie(state, playerId, slotIndex, amount, cardDef, targetPlayerId = playerId) {
	let total = amount;
	if (cardDef?.tag === 'food' && isHolderTextActive(state, playerId, 'mosje_binti')) total += 10;
	const target = state.players[targetPlayerId];
	if (target?.mpAmplifierActive) {
		total = roundToFive(total * 1.5);
		target.mpAmplifierActive = false;
	}
	return gainMP(state, targetPlayerId, slotIndex, total, 'PIECIE');
}
