// replayHeldAttack - replay a held attack after its reaction windows; it fizzles (ok, nothing happens) if the attacker can no longer act (Drain Reversal ruling 2026-10-18).
import { attackMosje } from '../actions/attackMosje.js';
import { canMosjeTakeAction } from '../actions/canMosjeTakeAction.js';

export function replayHeldAttack(state, playerId, params) {
	if (!canMosjeTakeAction(state, playerId, params.attackerSlotIndex).ok) {
		console.log(`[ATTACK] Fizzled: the attacker in slot ${params.attackerSlotIndex} can no longer act`);
		return { state, ok: true, success: true, fizzled: true };
	}
	return attackMosje(state, playerId, params, { skipReactions: true });
}
