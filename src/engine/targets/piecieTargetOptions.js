// piecieTargetOptions - the eligible Mosje slots for each pick a Piecie asks for (PIECIE_TARGETS).
// Returns [{ key, who, options: [{ playerId, slotIndex, label }] }]. Fresh opponent Mosjes are never offered.
import { PIECIE_TARGETS } from '../../rules/piecieTargets.js';
import { canTakeExtraUse } from '../abilities/canTakeExtraUse.js';
import { isFresh } from '../fresh/isFresh.js';

const MP_MAX = { mpMax20: 20, mpMax30: 30, mpMax40: 40 };
const STARS = { physical1: 1, physical2: 2 };

function passes(slot, rule) {
	if (rule === 'activatedAbility') return canTakeExtraUse(slot); // Redbull: an activated once-per-turn ability
	if (MP_MAX[rule] !== undefined) return slot.mp <= MP_MAX[rule];
	if (STARS[rule] !== undefined) return (slot.traits?.physical || 0) >= STARS[rule];
	return true;
}

export function piecieTargetOptions(state, playerId, cardId) {
	const oppId = Object.keys(state.players).find(id => id !== playerId);
	return (PIECIE_TARGETS[cardId] || []).map((spec) => {
		const sides = spec.who === 'own' ? [playerId] : spec.who === 'opp' ? [oppId] : [playerId, oppId];
		const options = [];
		for (const pid of sides) {
			(state.players[pid]?.activeSlots || []).forEach((slot, slotIndex) => {
				if (!slot || slot.isDefeated || !passes(slot, spec.rule)) return;
				if (isFresh(slot) && (pid !== playerId || spec.rule === 'notFresh')) return;
				options.push({ playerId: pid, slotIndex, label: slot.name });
			});
		}
		return { key: spec.key, who: spec.who, options };
	});
}
