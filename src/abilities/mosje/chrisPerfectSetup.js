// Chris, The All-Rounder — Perfect Setup: once per turn, if all 3 of your Piecie slots hold face-down Piecies:
// activate one of them for free (no Energy) and gain 15 MP. Input: state._pendingTargets.piecie_slot.
// RULING FLAG: "for free" is read as no Energy AND no readiness wait (a Piecie placed this turn may be chosen).
// Flip IGNORE_READINESS if the ruling says it must still be ready.
import { gainMP } from '../../engine/mpManager.js';
import { activatePiecieFree } from '../../engine/table/activatePiecieFree.js';

const IGNORE_READINESS = true;

export function chrisPerfectSetup(gameState, playerId, mosjeId = 'mosje_chris') {
	const state = JSON.parse(JSON.stringify(gameState));
	const player = state.players[playerId];
	const slotIndex = player?.activeSlots.findIndex(s => s && !s.isDefeated && s.cardId === mosjeId) ?? -1;
	if (slotIndex < 0) throw new Error('Chris is not on the field');
	const slots = player.piecieSlots || [];
	const faceDown = i => slots[i]?.type === 'PIECIE' && slots[i].faceDown && !slots[i].activated;
	if (slots.length < 3 || ![0, 1, 2].every(faceDown)) throw new Error('Perfect Setup needs 3 face-down Piecies');
	const chosen = state._pendingTargets?.piecie_slot;
	const pick = [0, 1, 2].includes(chosen) ? chosen : [0, 1, 2][0];
	// Gain first: a reaction window may pause the activation and replay it from this state.
	const gained = gainMP(state, playerId, slotIndex, 15, 'ABILITY');
	const res = activatePiecieFree(gained, playerId, { slotIndex: pick }, { ignoreReadiness: IGNORE_READINESS, source: 'chris_perfect_setup' });
	if (!res.success) throw new Error(res.error || 'Perfect Setup failed');
	return { state: res.state, success: true, reactionPending: res.reactionPending === true };
}
