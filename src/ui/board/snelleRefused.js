// snelleRefused.js — playSnellie refuses a Snelle (nothing paid, nothing placed) when Those Eyelashes blocks it or its "Needs / Only if" fails.
// A card played from the hand has no reaction window, so the condition is read with reaction = null, as the play does.
// Shared by bindSlotHint (the desktop hover mark) and getHandCardState (the phone raise). Pure: reads the state, changes nothing.
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { snelleConditionMet } from '../../rules/snelleConditions.js';

export function snelleRefused(gameState, localPlayerId, card) {
	if (card.type !== 'SNELLE_PIECIE') return false;
	if (gameState._snelleBlocked === localPlayerId) return true;
	return snelleConditionMet(gameState, localPlayerId, SNELLE_PIECIES.find((def) => def.id === card.cardId), null) !== true;
}
