// piecieActivationGate — rules that stop a Piecie from being activated at all (normal AND free).
// Returns an error string, or null when the Piecie may be activated. Pure.
import { PIECIE_CONDITIONS } from '../../rules/piecieConditions.js';
import { levelGateError } from './levelGateError.js';
import { dataNeedsReason } from '../needs/dataNeedsReason.js';
import { costGateError } from '../costs/costGateError.js';

export function piecieActivationGate(state, playerId, cardDef) {
	const player = state.players[playerId];
	if (cardDef?.attach && !player?.activeSlots?.some(s => s && !s.isDefeated)) return 'Attach needs one of your Mosjes on the field';
	const costGate = costGateError(state, playerId, cardDef); // D-22: an MP cost must leave the paying Mosje above 0
	if (costGate) return costGate;
	const levelGate = levelGateError(state, playerId, cardDef);
	if (levelGate) return levelGate;
	const check = PIECIE_CONDITIONS[cardDef?.id]; // "Only if / Needs" - checked before any Energy is paid
	if (check) {
		const res = check(state, playerId);
		if (res !== true) return res;
	}
	return dataNeedsReason(state, playerId, cardDef); // Needs declared as data: the reason, nothing paid
}
