// finishSnelle - after a Snelle effect resolved: Gevalletje Klakkeloos copy, slot freed (Stays cards keep it),
// cardPlayedFromHand triggers, victory check. Runs once per play (also after a pick pause).
import * as piecieEffects from '../../abilities/piecieEffects.js';
import { finishPiecieActivation } from '../table/finishPiecieActivation.js';
import { runMosjeTriggers } from '../mosje/runMosjeTriggers.js';
import { checkVictory } from '../victoryChecker.js';

export function finishSnelle(state, playerId, cardDef, cardId = cardDef.id) {
	const copyFlag = state._snelleFlags?.copyLastPiecie;
	if (copyFlag?.forPlayer === playerId && copyFlag.effectId) {
		const copiedFn = piecieEffects[copyFlag.effectId];
		if (typeof copiedFn === 'function') state = copiedFn(state, playerId);
		delete state._snelleFlags.copyLastPiecie;
	}
	const slots = state.players[playerId].piecieSlots;
	const idx = slots.findIndex(s => s?.cardId === cardId && s?.type === 'SNELLE_PIECIE');
	if (idx >= 0) state = finishPiecieActivation(state, playerId, idx, cardDef);
	state = runMosjeTriggers(state, 'cardPlayedFromHand', { playerId, cardType: 'SNELLE_PIECIE' });
	return checkVictory(state);
}
