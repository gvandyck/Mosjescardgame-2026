// replayHeldAttack - replay a held attack after its reaction windows; it fizzles (ok, nothing happens) if the attacker can no longer act
// (Drain Reversal ruling 2026-10-18) or if its target is gone (61.1-02: a Snelle play's own victory check swept it).
import { attackMosje } from '../actions/attackMosje.js';
import { canMosjeTakeAction } from '../actions/canMosjeTakeAction.js';
import { isValidAttackTarget } from '../actions/isValidAttackTarget.js';

export function replayHeldAttack(state, playerId, params) {
	if (!canMosjeTakeAction(state, playerId, params.attackerSlotIndex).ok) {
		console.log(`[ATTACK] Fizzled: the attacker in slot ${params.attackerSlotIndex} can no longer act`);
		return { state, ok: true, success: true, fizzled: true };
	}
	// The window was opened by a valid attack, so any invalid target at replay time was caused by the reaction itself
	// (for example Perfect Dodge's own victory check sweeping a stale getemt-while-sideways Mosje): the attack has nothing left to hit.
	if (!isValidAttackTarget(state, playerId, params.targetPlayerId, params.targetSlotIndex)) {
		console.log(`[ATTACK] Fizzled: the target in ${params.targetPlayerId} slot ${params.targetSlotIndex} is no longer there`);
		return { state, ok: true, success: true, fizzled: true };
	}
	return attackMosje(state, playerId, params, { skipReactions: true });
}
